// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocol712SignatureValidator} from "../interfaces/Modules.sol";
import {RegistryManager} from "../base/RegistryManager.sol";
import {ISafeProtocolFunctionHandler} from "../interfaces/Modules.sol";

/**
 * @title SignatureValidatorManager
 * @notice This contract maintains the signature validator(s) per account. Accounts can set separate signature validators for each domain separator.
 *         Implementaion of this contract is inspired by this pull request: https://github.com/rndlabs/safe-contracts/pull/1/files.
 *         TODO: SignatureValidatorManager inherits RegistryManager leading to possible state drift of Registry address.
 *              This should be fixed by moving RegistryManager to a separate contract and inheriting it in SignatureValidatorManager and FunctionHandlerManager.
 *         TODO: Evalute if default signature validator should be used in case if signature validator for a domain does not exist.
 *         TODO: Use hooks
 */
contract SignatureValidatorManager is RegistryManager, ISafeProtocolFunctionHandler {
    constructor(address _registry, address _initialOwner) RegistryManager(_registry, _initialOwner) {}

    // Storage
    /**
     * @notice Mapping to account address => domain separator => signatureValidator contract
     */
    mapping(address => mapping(bytes32 => address)) public signatureValdiators;

    // Events
    event SignatureValidatorChanged(address indexed account, bytes32 indexed domainSeparator, address indexed signatureValidator);

    // Errors
    error SingatureValidatorNotSet(address account);

    /**
     * @notice Sets the signature validator contract for an account
     * @param signatureValidator Address of the signature validator contract
     */
    function setSignatureValidator(bytes32 domainSeparator, address signatureValidator) external onlyAccount {
        if (signatureValidator != address(0)) {
            checkPermittedModule(signatureValidator);
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

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(ISafeProtocolFunctionHandler).interfaceId;
    }

    /**
     * @notice A view function that the Manager will call then an account has enabled this contract as a function handler in the Manager
     * @param account Address of the account whose signature validator is to be used
     * @param sender Address requesting signature validation
     * @param data Calldata containing the function selector, signature hash, domain separator, type hash, encoded data and payload forwarded by the Manager
     */
    function handle(
        address account,
        address sender,
        uint256 /* value */,
        bytes calldata data
    ) external view override returns (bytes memory) {
        // Should restrict msg.sender only to Manager?

        // Get the parameters for signature verification, skipping the first 4bytes as that is the non-padded selector.
        (bytes32 _hash, bytes32 domainSeparator, bytes32 typeHash, bytes memory encodedData, bytes memory payload) = abi.decode(
            data[4:],
            (bytes32, bytes32, bytes32, bytes, bytes)
        );

        // Last 32 bytes of data contains domainSeparator
        address signatureValidator = signatureValdiators[account][domainSeparator];

        if (signatureValidator == address(0)) {
            revert SingatureValidatorNotSet(account);
        }

        checkPermittedModule(signatureValidator);

        bytes4 returnValue = ISafeProtocol712SignatureValidator(signatureValidator).isValidSignature(
            account,
            sender,
            _hash,
            domainSeparator,
            typeHash,
            encodedData,
            payload
        );

        bytes memory returnData = abi.encode(returnValue);

        // Skip first 32 bytes to returnData containing the length of the bytes
        // solhint-disable-next-line no-inline-assembly
        assembly {
            return(add(returnData, 0x20), mload(returnData))
        }
    }

    function metadataProvider() external view override returns (uint256 providerType, bytes memory location) {}
}
