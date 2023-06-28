// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafe} from "./Accounts.sol";
import {SafeRootAccess, SafeTransaction} from "../DataTypes.sol";

/**
 * @title ISafeProtocolMediator interface a Mediator should implement
 * @notice A mediator checks the status of the component through the registry and allows only
 *         listed and non-flagged components to execute transactions. A Safe account should
 *         add mediator as a module.
 */
interface ISafeProtocolMediator {
    /**
     * @notice TODO
     * @param safe Instance of a Safe account
     * @param transaction SafeTransaction instance containing payload information about the transaction
     * @return data Array of bytes types returned upon the successful execution of all the actions. The size of the array will be the same as the size of the actions
     *         in case of succcessful execution. Empty if the call failed.
     */
    function executeTransaction(ISafe safe, SafeTransaction calldata transaction) external returns (bytes[] memory data);

    /**
     * @notice TODO
     * @param safe Instance of a Safe account
     * @param rootAccess SafeTransaction instance containing payload information about the transaction
     * @return data Arbitrary length bytes data returned upon the successful execution. Size of array will be same as size of actions
     *         in case of succcessful execution. Empty if the call failed.
     */
    function executeRootAccess(ISafe safe, SafeRootAccess calldata rootAccess) external returns (bytes memory data);
}
