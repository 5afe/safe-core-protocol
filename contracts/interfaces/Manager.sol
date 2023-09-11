// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {SafeRootAccess, SafeTransaction} from "../DataTypes.sol";

/**
 * @title ISafeProtocolManager interface a Manager should implement
 * @notice A manager checks the status of the module through the registry and allows only
 *         listed and non-flagged modules to execute transactions. An account should
 *         add the manager as a plugin.
 */
interface ISafeProtocolManager {
    /**
     * @notice This function allows enabled plugins to execute non-delegate call transactions thorugh a Safe.
     *         It should validate the status of the plugin through the registry and allows only listed and non-flagged modules to execute transactions.
     * @param account Address of an account
     * @param transaction SafeTransaction instance containing payload information about the transaction
     * @return data Array of bytes types returned upon the successful execution of all the actions. The size of the array will be the same as the size of the actions
     *         in case of succcessful execution. Empty if the call failed.
     */
    function executeTransaction(address account, SafeTransaction calldata transaction) external returns (bytes[] memory data);

    /**
     * @notice This function allows enabled plugins to execute delegate call transactions thorugh a Safe.
     *         It should validate the status of the plugin through the registry and allows only listed and non-flagged modules to execute transactions.
     * @param account Address of an account
     * @param rootAccess SafeTransaction instance containing payload information about the transaction
     * @return data Arbitrary length bytes data returned upon the successful execution. The size of the array will be the same as the size of the actions
     *         in case of succcessful execution. Empty if the call failed.
     */
    function executeRootAccess(address account, SafeRootAccess calldata rootAccess) external returns (bytes memory data);
}
