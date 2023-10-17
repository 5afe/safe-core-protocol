// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocol712SignatureValidator} from "./interfaces/Modules.sol";
import {RegistryManager} from "./base/RegistryManager.sol";
import {ISafeProtocolFunctionHandler, ISafeProtocolSignatureValidatorHooks} from "./interfaces/Modules.sol";
import {MODULE_TYPE_SIGNATURE_VALIDATOR, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS} from "./common/Constants.sol";
import {ISafeAccount} from "./interfaces/Accounts.sol";
import {ISafeProtocolSignatureValidatorManager} from "./interfaces/Manager.sol";

/**
 * @title SignatureValidatorManager
 * @notice This contract maintains the signature validator(s) per account. Accounts can set separate signature validators for each domain separator.
 *         Implementaion of this contract is inspired by this pull request: https://github.com/rndlabs/safe-contracts/pull/1/files.
 *         TODO: SignatureValidatorManager inherits RegistryManager leading to possible state drift of Registry address.
 *              This should be fixed by moving RegistryManager to a separate contract and inheriting it in SignatureValidatorManager and FunctionHandlerManager.
 *         TODO: Evalute if default signature validator should be used in case if signature validator for a domain does not exist.
 *         Do not set this contract as a fallback handler of a Safe account. Why? To do
 */

contract SignatureValidatorManager is RegistryManager, ISafeProtocolFunctionHandler, ISafeProtocolSignatureValidatorManager {
    constructor(address _registry, address _initialOwner) RegistryManager(_registry, _initialOwner) {}

    // Signature selector 0x990cfdb9
    bytes4 public constant SIGNATURE_VALIDATOR_SELECTOR = bytes4(keccak256("Account712Signature(bytes32,bytes32,bytes)"));

    // Storage
    /**
     * @notice Mapping to account address => domain separator => signature validator contract
     */
    mapping(address => mapping(bytes32 => address)) public signatureValdiators;

    /**
     * @notice Mapping to account address => signature validator hooks contract
     */
    mapping(address => address) public signatureValdiatorHooks;

    // Events
    event SignatureValidatorChanged(address indexed account, bytes32 indexed domainSeparator, address indexed signatureValidator);
    event SignatureValidatorHooksChanged(address indexed account, address indexed signatureValidatorHooks);

    // Errors
    error SignatureValidatorNotSet(address account);

    /**
     * @notice Sets the signature validator contract for an account
     * @param signatureValidator Address of the signature validator contract
     */
    function setSignatureValidator(bytes32 domainSeparator, address signatureValidator) external {
        if (signatureValidator != address(0)) {
            checkPermittedModule(signatureValidator, MODULE_TYPE_SIGNATURE_VALIDATOR);

            if (
                !ISafeProtocol712SignatureValidator(signatureValidator).supportsInterface(
                    type(ISafeProtocol712SignatureValidator).interfaceId
                )
            ) revert ContractDoesNotImplementValidInterfaceId(signatureValidator);
        }
        signatureValdiators[msg.sender][domainSeparator] = signatureValidator;

        // Only one type of event is emitted for simplicity rather one for each individual
        // case: remvoing, updating, adding new signature validator.
        emit SignatureValidatorChanged(msg.sender, domainSeparator, signatureValidator);
    }

    /**
     * @notice Sets the signature validator hooks for an account
     * @param signatureValidatorHooks Address of the signature validator hooks contract
     */
    function setSignatureValidatorHooks(address signatureValidatorHooks) external override {
        if (signatureValidatorHooks != address(0)) {
            checkPermittedModule(signatureValidatorHooks, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);

            if (
                !ISafeProtocolSignatureValidatorHooks(signatureValidatorHooks).supportsInterface(
                    type(ISafeProtocolSignatureValidatorHooks).interfaceId
                )
            ) revert ContractDoesNotImplementValidInterfaceId(signatureValidatorHooks);
        }
        signatureValdiatorHooks[msg.sender] = signatureValidatorHooks;

        // Only one type of event is emitted for simplicity rather one for each individual
        // case: remvoing, updating, adding new signature validator.
        emit SignatureValidatorHooksChanged(msg.sender, signatureValidatorHooks);
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(ISafeProtocolFunctionHandler).interfaceId;
    }

    /**
     * @notice A non-view function that the Manager will call when an account has enabled this contract as a function handler in the Manager
     * @param account Address of the account whose signature validator is to be used
     * @param sender Address requesting signature validation
     * @param data Calldata containing the function selector, signature hash, domain separator, type hash, encoded data and payload forwarded by the Manager
     */
    function handle(address account, address sender, uint256 /* value */, bytes calldata data) external override returns (bytes memory) {
        (bytes32 messageHash, bytes memory signatureData) = abi.decode(data[4:], (bytes32, bytes));

        address signatureValidatorHooks = signatureValdiatorHooks[account];
        bytes memory prevalidationData;
        bytes memory returnData;

        if (signatureValidatorHooks != address(0)) {
            checkPermittedModule(signatureValidatorHooks, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
            prevalidationData = ISafeProtocolSignatureValidatorHooks(signatureValidatorHooks).preValidationHook(account, sender, data);
        }

        if (bytes4(data[100:104]) == SIGNATURE_VALIDATOR_SELECTOR) {
            returnData = abi.encode(validateWith712SignatureValdiator(account, sender, messageHash, data[104:]));

            if (signatureValidatorHooks != address(0)) {
                ISafeProtocolSignatureValidatorHooks(signatureValidatorHooks).postValidationHook(account, prevalidationData);
            }
            return returnData;
        }

        returnData = defaultValidator(account, messageHash, signatureData);
        if (signatureValidatorHooks != address(0)) {
            ISafeProtocolSignatureValidatorHooks(signatureValidatorHooks).postValidationHook(account, prevalidationData);
        }
        return returnData;
    }

    function defaultValidator(address account, bytes32 hash, bytes memory signatures) internal returns (bytes memory) {
        ISafeAccount(account).checkSignatures(hash, "", signatures);
        // bytes4(keccak256("isValidSignature(bytes32,bytes)")
        return abi.encode(0x1626ba7e);
    }

    function validateWith712SignatureValdiator(
        address account,
        address sender,
        bytes32 messageHash,
        bytes calldata data
    ) private returns (bytes4) {
        (bytes32 domainSeparator, bytes32 structHash, bytes memory signatures) = abi.decode(data, (bytes32, bytes32, bytes));

        address signatureValidator = signatureValdiators[account][domainSeparator];
        if (signatureValidator == address(0)) {
            revert SignatureValidatorNotSet(account);
        }

        checkPermittedModule(signatureValidator, MODULE_TYPE_SIGNATURE_VALIDATOR);

        return
            ISafeProtocol712SignatureValidator(signatureValidator).isValidSignature(
                account,
                sender,
                messageHash,
                domainSeparator,
                structHash,
                signatures
            );
    }

    function metadataProvider() external view override returns (uint256 providerType, bytes memory location) {}
}
