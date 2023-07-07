// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafe} from "./Accounts.sol";
import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title ISafeProtocolStaticFallbackMethod - An interface that a Safe fallbackhandler should implement
 * @notice In Safe protocol, a fallback handler can be used to add additional functionality to a Safe.
 *         TODO: Add more explaination.
 */
interface ISafeProtocolFallbackMethod {
    /**
     * @notice TODO: Add more explaination
     * @param safe A Safe instance
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external returns (bytes memory result);
}

/**
 * @title ISafeProtocolStaticFallbackMethod - An interface that a Safe fallbackhandler should implement in case when handling static calls
 * @notice In Safe protocol, a fallback handler can be used to add additional functionality to a Safe.
 *         TODO: Add more explaination.
 */
interface ISafeProtocolStaticFallbackMethod {
    /**
     * @notice TODO: Add more explaination
     * @param safe A Safe instance
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external view returns (bytes memory result);
}

/**
 * @title ISafeProtocolHook - An interface that a Safe hook should implement.
 * @notice In Safe protocol, a hook can approve or deny transactions based on the logic it implements.
 */
interface ISafeProtocolHook is IERC165 {
    /**
     * @notice A function that will be called by a safe before the execution of a transaction if the hook is enabled
     * @dev Add custom logic in this function to validate the pre-state and contents of transaction for non-root access.
     * @param safe A Safe instance
     * @param tx A struct of type SafeTransaction that contains the details of the transaction.
     * @param executionType uint256
     * @param executionMeta Arbitrary length of bytes
     * @return preCheckData bytes
     */
    function preCheck(
        ISafe safe,
        SafeTransaction calldata tx,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    /**
     * @notice A function that will be called by a safe before the execution of a transaction if the hook is enabled and
     *         transaction requies tool access.
     * @dev Add custom logic in this function to validate the pre-state and contents of transaction for root access.
     * @param safe A Safe instance
     * @param rootAccess DataTypes.SafeRootAccess
     * @param executionType uint256
     * @param executionMeta bytes
     * @return preCheckData bytes
     */
    function preCheckRootAccess(
        ISafe safe,
        SafeRootAccess calldata rootAccess,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    /**
     * @notice A function that will be called by a safe after the execution of a transaction if the hook is enabled. A hook should revert if the post state of after the transaction is not as expected.
     * @dev Add custom logic in this function to validate the post-state after the transaction is executed.
     * @param safe ISafe
     * @param success bool
     * @param preCheckData Arbitrary length bytes that was returned by during pre-check of the transaction.
     */
    function postCheck(ISafe safe, bool success, bytes calldata preCheckData) external;
}

/**
 * @title ISafeProtocolPlugin - An interface that a Safe plugin should implement
 */
interface ISafeProtocolPlugin {
    /**
     * @notice A funtion that returns name of the plugin
     * @return name string name of the plugin
     */
    function name() external view returns (string memory name);

    /**
     * @notice A funtion that returns version of the plugin
     * @return version string version of the plugin
     */
    function version() external view returns (string memory version);

    /**
     * @notice A funtion that returns version of the plugin.
     *         TODO: Define types of meta provider and possible values of location in each of the cases.
     * @return providerType uint256 Type of meta provider
     * @return location bytes
     */
    function metaProvider() external view returns (uint256 providerType, bytes memory location);

    /**
     * @notice A function that indicates if the plugin requires root access to a Safe.
     * @return requiresRootAccess True if root access is required, false otherwise.
     */
    function requiresRootAccess() external view returns (bool requiresRootAccess);
}
