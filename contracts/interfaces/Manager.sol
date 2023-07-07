// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafe} from "./Accounts.sol";
import {SafeRootAccess, SafeTransaction} from "../DataTypes.sol";

/**
 * @title ISafeProtocolManager interface a Manager should implement
 * @notice A mediator checks the status of the integration through the registry and allows only
 *         listed and non-flagged integrations to execute transactions. A Safe account should
 *         add a mediator as a plugin.
 */
interface ISafeProtocolManager {
    /**
     * @notice This function allows enabled plugins to execute non-delegate call transactions thorugh a Safe.
     *         It should validate the status of the plugin through the registry and allows only listed and non-flagged integrations to execute transactions.
     * @param safe Address of a Safe account
     * @param transaction SafeTransaction instance containing payload information about the transaction
     * @return data Array of bytes types returned upon the successful execution of all the actions. The size of the array will be the same as the size of the actions
     *         in case of succcessful execution. Empty if the call failed.
     */
    function executeTransaction(ISafe safe, SafeTransaction calldata transaction) external returns (bytes[] memory data);

    /**
     * @notice This function allows enabled plugins to execute delegate call transactions thorugh a Safe.
     *         It should validate the status of the plugin through the registry and allows only listed and non-flagged integrations to execute transactions.
     * @param safe Address of a Safe account
     * @param rootAccess SafeTransaction instance containing payload information about the transaction
     * @return data Arbitrary length bytes data returned upon the successful execution. The size of the array will be the same as the size of the actions
     *         in case of succcessful execution. Empty if the call failed.
     */
    function executeRootAccess(ISafe safe, SafeRootAccess calldata rootAccess) external returns (bytes memory data);
}
