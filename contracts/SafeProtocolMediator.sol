// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolMediator} from "./interfaces/Mediator.sol";
import {ISafe} from "./interfaces/Accounts.sol";
import "./DataTypes.sol";

/**
 * @title
 * @notice
 */
contract SafeProtocolMediator is ISafeProtocolMediator {
    /**
     * @notice TODO
     * @param safe TODO
     * @param transaction TODO
     * @return success TODO
     * @return data TODO
     */
    function executeTransaction(
        ISafe safe,
        SafeTransaction calldata transaction
    ) external view override returns (bool success, bytes memory data) {}

    /**
     * @notice TODO
     * @param safe TODO
     * @param rootAccess TODO
     * @return success TODO
     * @return data TODO
     */
    function executeRootAccess(
        ISafe safe,
        SafeRootAccess calldata rootAccess
    ) external view override returns (bool success, bytes memory data) {}
}
