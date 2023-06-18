// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;
import "../../external/interfaces/ISafe.sol";
import "../../libraries/DataTypes.sol";

/**
 * @title ISafeProtocolGuard - An interface that a Safe guard should implement
 * @notice In Safe protocol, a guard can deny transactions based in the logic it implements.
 *         TODO: Add more explaination.
 */
interface ISafeProtocolGuard {
    /**
     * @notice A function that will be called by a safe before the execution of a transaction if the guard is enabled
     *         TODO: Add more explaination and update description of each param.
     * @param safe ISafe
     * @param executionType uint256
     * @param executionMeta bytes
     * @return preCheckData bytes
     */
    function preCheck(
        ISafe safe,
        DataTypes.SafeTransaction calldata tx,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    /**
     * @notice A function that will be called by a safe before the execution of a transaction if the guard is enabled and
     *         transaction requies tool access. 
     *         TODO: Add more explaination and update description of each param.
     * @param safe ISafe
     * @param rootAccess DataTypes.SafeRootAccess
     * @param executionType uint256
     * @param executionMeta bytes
     * @return preCheckData bytes
     */
    function preCheckRootAccess(
        ISafe safe,
        DataTypes.SafeRootAccess calldata rootAccess,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    /**
     * @notice A function that will be called by a safe after the execution of a transaction if the guard is enabled
     *         TODO: Add more explaination and update description of each param.
     * @param safe ISafe
     * @param success bool
     * @param preCheckData bytes
     */
    function postCheck(ISafe safe, bool success, bytes calldata preCheckData) external;
}
