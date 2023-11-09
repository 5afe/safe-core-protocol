// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolSignatureValidator} from "./interfaces/Modules.sol";
import {RegistryManager} from "./base/RegistryManager.sol";
import {ISafeProtocolFunctionHandler, ISafeProtocolSignatureValidatorHooks} from "./interfaces/Modules.sol";
import {MODULE_TYPE_SIGNATURE_VALIDATOR, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS} from "./common/Constants.sol";
import {IAccount} from "./interfaces/Accounts.sol";
import {ISafeProtocolSignatureValidatorManager} from "./interfaces/Manager.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title SignatureValidatorManager
 * @notice This contract facilitates signature validation. It maintains the signature validator(s) per account per domain or uses a default validation scheme based on the content of the data passed.
 *         This contract follows the Safe{Core} Protocol specification for signature validation. For more details on specification refer to https://github.com/safe-global/safe-core-protocol-specs.
 *         Implementaion of this contract is inspired by this pull request: https://github.com/rndlabs/safe-contracts/pull/1/files.
 *         Expected setup to use this contract for signature validation is as follows:
 *                  - Account enables SafeProtocolManager as a fallback handler
 *                  - Account sets SignatureValidatorManager as a function handler for a function selector e.g. 0x1626ba7e i.e. bytes4(keccak256("isValidSignature(bytes32,bytes)")
 * @dev SignatureValidatorManager inherits RegistryManager leading to possible state drift of Registry address with the SafeProtocolManager contract.
 *      Do not set this contract as a fallback handler of a Safe account. Using this as a fallback handler would allow unauthorised setting of signature validator and signature validator hooks.
 */

contract SignatureValidatorManager is RegistryManager, ISafeProtocolFunctionHandler, ISafeProtocolSignatureValidatorManager {
    constructor(address _registry, address _initialOwner) RegistryManager(_registry, _initialOwner) {}

    // constants
    // Signature selector bytes4(keccak256("Account712Signature(bytes32,bytes32,bytes)"));
    bytes4 public constant SIGNATURE_VALIDATOR_SELECTOR = 0xb5c726cb;

    // keccak256("SafeMessage(bytes message)");
    bytes32 private constant ACCOUNT_MSG_TYPEHASH = 0x60b3cbf8b4a223d68d641b3b6ddf9a298e7f33710cf3d3a9d1146b5a6150fbca;

    // keccak256(
    //     "EIP712Domain(uint256 chainId,address verifyingContract)"
    // );
    bytes32 private constant DOMAIN_SEPARATOR_TYPEHASH = 0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218;

    // Storage
    /**
     * @notice Mapping to domain separator => account address => signature validator contract
     * @dev The key of the inner-most mapping is the account address, which is required for 4337-compatibility.
     */
    mapping(bytes32 => mapping(address => address)) public signatureValidators;

    /**
     * @notice Mapping to account address => signature validator hooks contract
     */
    mapping(address => address) public signatureValidatorHooks;

    // Events
    /**
     * @notice Only one type of event is emitted for simplicity rather one for each individual case: remvoing, updating, adding new signature validator.
     */
    event SignatureValidatorChanged(address indexed account, bytes32 indexed domainSeparator, address indexed signatureValidator);

    /**
     * @notice Only one type of event is emitted for simplicity rather one for each individual case: remvoing, updating, adding new signature validator hooks.
     */
    event SignatureValidatorHooksChanged(address indexed account, address indexed signatureValidatorHooks);

    // Errors
    error SignatureValidatorNotSet(address account);
    error InvalidMessageHash(bytes32 messageHash);

    /**
     * @notice Sets the signature validator contract for an account
     * @param signatureValidator Address of the signature validator contract
     */
    function setSignatureValidator(bytes32 domainSeparator, address signatureValidator) external {
        if (signatureValidator != address(0)) {
            checkPermittedModule(signatureValidator, MODULE_TYPE_SIGNATURE_VALIDATOR);

            if (!ISafeProtocolSignatureValidator(signatureValidator).supportsInterface(type(ISafeProtocolSignatureValidator).interfaceId))
                revert ContractDoesNotImplementValidInterfaceId(signatureValidator);
        }
        signatureValidators[domainSeparator][msg.sender] = signatureValidator;

        emit SignatureValidatorChanged(msg.sender, domainSeparator, signatureValidator);
    }

    /**
     * @notice Sets the signature validator hooks for an account
     * @param signatureValidatorHooksAddress Address of the signature validator hooks contract
     */
    function setSignatureValidatorHooks(address signatureValidatorHooksAddress) external override {
        if (signatureValidatorHooksAddress != address(0)) {
            checkPermittedModule(signatureValidatorHooksAddress, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);

            if (
                !ISafeProtocolSignatureValidatorHooks(signatureValidatorHooksAddress).supportsInterface(
                    type(ISafeProtocolSignatureValidatorHooks).interfaceId
                )
            ) revert ContractDoesNotImplementValidInterfaceId(signatureValidatorHooksAddress);
        }
        signatureValidatorHooks[msg.sender] = signatureValidatorHooksAddress;

        emit SignatureValidatorHooksChanged(msg.sender, signatureValidatorHooksAddress);
    }

    /**
     * @notice A view function that the Manager will call when an account has enabled this contract as a function handler in the Manager
     * @param account Address of the account whose signature validator is to be used
     * @param sender Address requesting signature validation
     * @param data Calldata containing the 4 bytes function selector, 32 bytes message hash and payload.
     *             Layout of data:
     *             0x00 to 0x04 - 4 bytes function selector when this contract is set as a function handler in the SafeProtocolManager i.e. 0x1626ba7e
     *             0x04 to 0x24 - 32 bytes hash of the message used for signing
     *             0x24 to end - bytes containing signatures or signatureData either one of the below:
     *             If first 4 bytes of signatureData are 0xb5c726cb i.e. bytes4(keccak256("Account712Signature(bytes32,bytes32,bytes)")); then it will be interpreted as follows:
     *                  payload = abi.encodeWithSelector(0xb5c726cb, abi.encode(domainSeparator, structHash, signatures)
     *                  Layout of `data` parameter in this case:
     *                  0x00 to 0x04 - 4 bytes function selector when this contract is set as a function handler in the SafeProtocolManager i.e. 0x1626ba7e
     *                  0x04 to 0x24 - 32 bytes hash of the signed message
     *                  0x24 to 0x44 - 32 bytes offset to the start of `bytes` parameter
     *                  0x44 to 0x64 - 32 bytes length of `bytes` parameter
     *                  0x64 to 0x68 - 4 bytes of Signature selector
     *                  0x68 to 0x88 - 32 bytes domain separator
     *                  0x88 to 0xa8 - 32 bytes struct hash
     *                  0xa8 to end - contains offset, length of bytes, and actual bytes containing signatures
     *             Else:
     *                 bytes containing signature data
     *                 default validation flow will be used which will depend on the account implementation
     *
     */
    function handle(
        address account,
        address sender,
        uint256 /* value */,
        bytes calldata data
    ) external view override returns (bytes memory) {
        // Skip first 4 bytes of data as it contains function selector
        (bytes32 messageHash, bytes memory signatureData) = abi.decode(data[0x4:], (bytes32, bytes));

        address signatureValidatorHooksAddress = signatureValidatorHooks[account];
        bytes memory prevalidationData;
        bytes memory returnData;

        if (signatureValidatorHooksAddress != address(0)) {
            checkPermittedModule(signatureValidatorHooksAddress, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
            prevalidationData = ISafeProtocolSignatureValidatorHooks(signatureValidatorHooksAddress).preValidationHook(
                account,
                sender,
                data
            );
        }

        if (bytes4(data[0x64:0x68]) == SIGNATURE_VALIDATOR_SELECTOR) {
            returnData = abi.encode(validateWithSignatureValdiator(account, sender, messageHash, data[0x68:]));
        } else {
            returnData = defaultValidator(account, messageHash, signatureData);
        }

        if (signatureValidatorHooksAddress != address(0)) {
            ISafeProtocolSignatureValidatorHooks(signatureValidatorHooksAddress).postValidationHook(account, prevalidationData);
        }
        return returnData;
    }

    /**
     * @notice A view function for default signature validation flow.
     * @param account Address of the account whose signature is to be validated. Account should support function `checkSignatures(bytes32, bytes, bytes)`
     * @param hash bytes32 hash of the data that is signed
     * @param signatures Arbitrary length bytes array containing the signatures
     */
    function defaultValidator(address account, bytes32 hash, bytes memory signatures) internal view returns (bytes memory) {
        bytes memory messageData = abi.encodePacked(
            bytes1(0x19),
            bytes1(0x01),
            keccak256(abi.encode(DOMAIN_SEPARATOR_TYPEHASH, block.chainid, account)),
            keccak256(abi.encode(ACCOUNT_MSG_TYPEHASH, keccak256(abi.encode(hash))))
        );
        bytes32 messageHash = keccak256(messageData);
        IAccount(account).checkSignatures(messageHash, messageData, signatures);
        // bytes4(keccak256("isValidSignature(bytes32,bytes)")
        return abi.encode(0x1626ba7e);
    }

    /**
     *
     * @param account Address of the account whose signature is to be validated
     * @param sender Address of the entitty that requested for signature validation
     * @param messageHash Hash of the message that is signed
     * @param data Arbitrary length bytes array containing the domain separator, struct hash and signatures
     */
    function validateWithSignatureValdiator(
        address account,
        address sender,
        bytes32 messageHash,
        bytes calldata data
    ) internal view returns (bytes4) {
        (bytes32 domainSeparator, bytes32 structHash, bytes memory signatures) = abi.decode(data, (bytes32, bytes32, bytes));

        if (keccak256(abi.encodePacked(bytes1(0x19), bytes1(0x01), domainSeparator, structHash)) != messageHash) {
            revert InvalidMessageHash(messageHash);
        }

        address signatureValidator = signatureValidators[domainSeparator][account];
        if (signatureValidator == address(0)) {
            revert SignatureValidatorNotSet(account);
        }

        checkPermittedModule(signatureValidator, MODULE_TYPE_SIGNATURE_VALIDATOR);

        return
            ISafeProtocolSignatureValidator(signatureValidator).isValidSignature(
                account,
                sender,
                messageHash,
                domainSeparator,
                structHash,
                signatures
            );
    }

    /**
     * @notice A function that returns module information.
     * @return providerType uint256 Type of metadata provider
     * @return location Arbitrary length bytes data containing the location of the metadata provider
     */
    function metadataProvider() external view override returns (uint256 providerType, bytes memory location) {}

    /**
     * @param interfaceId bytes4 interface id to be checked
     * @return true if interface is supported
     */
    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(ISafeProtocolSignatureValidatorManager).interfaceId ||
            interfaceId == type(ISafeProtocolFunctionHandler).interfaceId;
    }
}
