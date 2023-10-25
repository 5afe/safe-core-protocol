// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title ISafeProtocolFunctionHandler - An interface that an Account function handler should implement to handle static calls.
 * @notice In Safe{Core} Protocol, a function handler can be used to add additional functionality to an account.
 *         User(s) should add SafeProtocolManager as a function handler (aka fallback handler in Safe v1.x) to the account
 *         and enable the contract implementing ISafeProtocolFunctionHandler interface as a function handler in the
 *         SafeProtocolManager for the specific function identifier.
 */
interface ISafeProtocolFunctionHandler is IERC165 {
    /**
     * @notice Handles calls to the account contract forwarded by the fallback function.
     * @param account Address of the account
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(address account, address sender, uint256 value, bytes calldata data) external returns (bytes memory result);

    /**
     * @notice A function that returns information about the type of metadata provider and its location.
     *         For more information on metadata provider, refer to https://github.com/safe-global/safe-core-protocol-specs/.
     * @return providerType uint256 Type of metadata provider
     * @return location bytes
     */
    function metadataProvider() external view returns (uint256 providerType, bytes memory location);
}

/**
 * @title ISafeProtocolStaticFunctionHandler - An interface that a Safe{Core} Protocol Function handler should implement in case when handling static calls
 * @notice In Safe{Core} Protocol, a function handler can be used to add additional functionality to an account.
 *         User(s) should add SafeProtocolManager as a function handler (aka fallback handler in Safe v1.x) to the account
 *         and enable the contract implementing ISafeProtocolStaticFunctionHandler interface as a function handler in the
 *         SafeProtocolManager for the specific function identifier.
 */
interface ISafeProtocolStaticFunctionHandler is IERC165 {
    /**
     * @notice Handles static calls to the account contract forwarded by the fallback function.
     * @param account Address of the account
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(address account, address sender, uint256 value, bytes calldata data) external view returns (bytes memory result);

    /**
     * @notice A function that returns information about the type of metadata provider and its location.
     *         For more information on metadata provider, refer to https://github.com/safe-global/safe-core-protocol-specs/.
     * @return providerType uint256 Type of metadata provider
     * @return location bytes
     */
    function metadataProvider() external view returns (uint256 providerType, bytes memory location);
}

/**
 * @title ISafeProtocolHooks - An interface that a contract should implement to be enabled as hooks.
 * @notice In Safe{Core} Protocol, hooks can approve or deny transactions based on the logic it implements.
 */
interface ISafeProtocolHooks is IERC165 {
    /**
     * @notice A function that will be called before the execution of a transaction if the hooks are enabled
     * @dev Add custom logic in this function to validate the pre-state and contents of transaction for non-root access.
     * @param account Address of the account
     * @param tx A struct of type SafeTransaction that contains the details of the transaction.
     * @param executionType uint256
     * @param executionMeta Arbitrary length of bytes
     * @return preCheckData bytes
     */
    function preCheck(
        address account,
        SafeTransaction calldata tx,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    /**
     * @notice A function that will be called before the execution of a transaction if the hooks are enabled and
     *         transaction requies root access.
     * @dev Add custom logic in this function to validate the pre-state and contents of transaction for root access.
     * @param account Address of the account
     * @param rootAccess DataTypes.SafeRootAccess
     * @param executionType uint256
     * @param executionMeta bytes
     * @return preCheckData bytes
     */
    function preCheckRootAccess(
        address account,
        SafeRootAccess calldata rootAccess,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    /**
     * @notice A function that will be called after the execution of a transaction if the hooks are enabled. Hooks should revert if the post state of after the transaction is not as expected.
     * @dev Add custom logic in this function to validate the post-state after the transaction is executed.
     * @param account Address of the account
     * @param success bool
     * @param preCheckData Arbitrary length bytes that was returned by during pre-check of the transaction.
     */
    function postCheck(address account, bool success, bytes calldata preCheckData) external;
}

/**
 * @title ISafeProtocolPlugin - An interface that a Safe{Core} Protocol Plugin should implement
 */
interface ISafeProtocolPlugin is IERC165 {
    /**
     * @notice A funtion that returns name of the plugin
     * @return name string name of the plugin
     */
    function name() external view returns (string memory name);

    /**
     * @notice A function that returns version of the plugin
     * @return version string version of the plugin
     */
    function version() external view returns (string memory version);

    /**
     * @notice A function that returns information about the type of metadata provider and its location.
     *         For more information on metadata provider, refer to https://github.com/safe-global/safe-core-protocol-specs/.
     * @return providerType uint256 Type of metadata provider
     * @return location bytes
     */
    function metadataProvider() external view returns (uint256 providerType, bytes memory location);

    /**
     * @notice A function that indicates permissions required by the.
     * @dev Permissions types and value: EXECUTE_CALL = 1, CALL_TO_SELF = 2, EXECUTE_DELEGATECALL = 4.
     *      These values can be sumed to indicate multiple permissions. e.g. EXECUTE_CALL + CALL_TO_SELF = 3
     * @return permissions Bit-based permissions required by the plugin.
     */
    function requiresPermissions() external view returns (uint8 permissions);
}

interface ISafeProtocolSignatureValidator is IERC165 {
    /**
     * @param account The account that has delegated the signature verification
     * @param sender The address that originally called the Safe's `isValidSignature` method
     * @param structHash The EIP-712 hash whose signature will be verified
     * @param domainSeparator The EIP-712 domainSeparator
     * @param structHash The EIP-712 structHash
     * @param payload An arbitrary payload that can be used to pass additional data to the validator
     * @return magic The magic value that should be returned if the signature is valid (0x1626ba7e)
     */
    function isValidSignature(
        address account,
        address sender,
        bytes32 messageHash,
        bytes32 domainSeparator,
        bytes32 structHash,
        bytes calldata payload
    ) external view returns (bytes4 magic);
}

interface ISafeProtocolSignatureValidatorHooks is IERC165 {
    /**
     * @param account Address of the account for which signature is being validated
     * @param validator Address of the validator contract to be used for signature validation. This address will be account address in case of default signature validation flow is used.
     * @param payload The payload provided for the validation
     * @return result bytes containing the result
     */
    function preValidationHook(address account, address validator, bytes calldata payload) external view returns (bytes memory result);

    /**
     * @param account Address of the account for which signature is being validated
     * @param preValidationData Data returned by preValidationHook
     * @return result bytes containing the result
     */
    function postValidationHook(address account, bytes calldata preValidationData) external view returns (bytes memory result);
}
