// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafe} from "./Accounts.sol";
import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title ISafeProtocolFunctionHandler - An interface that a Safe function handler should implement to handle static calls.
 * @notice In Safe{Core} Protocol, a function handler can be used to add additional functionality to a Safe.
 *         User(s) should add SafeProtocolManager as a function handler (aka fallback handler in Safe v1.x) to the Safe
 *         and enable the contract implementing ISafeProtocolFunctionHandler interface as a function handler in the
 *         SafeProtocolManager for the specific function identifier.
 */
interface ISafeProtocolFunctionHandler is IERC165 {
    /**
     * @notice Handles calls to the Safe contract forwarded by the fallback function.
     * @param safe A Safe instance
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external returns (bytes memory result);
}

/**
 * @title ISafeProtocolStaticFunctionHandler - An interface that a Safe functionhandler should implement in case when handling static calls
 * @notice In Safe{Core} Protocol, a function handler can be used to add additional functionality to a Safe.
 *         User(s) should add SafeProtocolManager as a function handler (aka fallback handler in Safe v1.x) to the Safe
 *         and enable the contract implementing ISafeProtocolStaticFunctionHandler interface as a function handler in the
 *         SafeProtocolManager for the specific function identifier.
 */
interface ISafeProtocolStaticFunctionHandler {
    /**
     * @notice Handles static calls to the Safe contract forwarded by the fallback function.
     * @param safe A Safe instance
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external view returns (bytes memory result);
}

/**
 * @title ISafeProtocolHooks - An interface that a contract should implement to be enabled as hooks.
 * @notice In Safe{Core} Protocol, hooks can approve or deny transactions based on the logic it implements.
 */
interface ISafeProtocolHooks is IERC165 {
    /**
     * @notice A function that will be called by a Safe before the execution of a transaction if the hooks are enabled
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
     * @notice A function that will be called by a safe before the execution of a transaction if the hooks are enabled and
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
     * @notice A function that will be called by a safe after the execution of a transaction if the hooks are enabled. Hooks should revert if the post state of after the transaction is not as expected.
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
     * @notice A function that indicates if the plugin requires root access to a Safe.
     * @return requiresRootAccess True if root access is required, false otherwise.
     */
    function requiresRootAccess() external view returns (bool requiresRootAccess);
}
