// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolMediator} from "./interfaces/Mediator.sol";
import {ISafeProtocolModule} from "./interfaces/Components.sol";

import {ISafe} from "./interfaces/Accounts.sol";
import "./DataTypes.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title TODO
 * @notice TODO
 */
contract SafeProtocolMediator is ISafeProtocolMediator, Ownable2Step {
    mapping(address => uint) public nonces;

    event ActionsExecuted(address safe, bytes32 metaHash);
    event RootAccessActionsExecuted(address safe, bytes32 metaHash);

    error InvalidNonce(address sender, uint256 nonce);
    error ModuleRequiresRootAccess(address sender);

    constructor(address initalOwner) {
        _transferOwnership(initalOwner);
    }

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
    ) external override returns (bool success, bytes[] memory data) {
        // TODO: Check for re-entrancy attacks
        // TODO: Validate metahash

        if (ISafeProtocolModule(msg.sender).requiresRootAccess()) {
            revert ModuleRequiresRootAccess(msg.sender);
        }

        if (nonces[msg.sender] != transaction.nonce) {
            revert InvalidNonce(msg.sender, transaction.nonce);
        }

        nonces[msg.sender]++;

        data = new bytes[](transaction.actions.length);
        for (uint256 i = 0; i < transaction.actions.length; ++i) {
            SafeProtocolAction memory safeProtocolAction = transaction.actions[i];
            //TODO: Set data variable or update documentation
            safe.execTransactionFromModule(safeProtocolAction.to, safeProtocolAction.value, safeProtocolAction.data, 0);
        }
        success = true;
    }

    /**
     * @notice TODO
     * @param safe TODO
     * @param rootAccess TODO
     * @return success TODO
     * @return data TODO
     */
    function executeRootAccess(ISafe safe, SafeRootAccess calldata rootAccess) external override returns (bool success, bytes memory data) {
        SafeProtocolAction memory safeProtocolAction = rootAccess.action;
        // TODO: Set data variable or update documentation
        // TODO: Check for re-entrancy attacks
        // TODO: Validate metahash

        // Re-confirm if this check if needed and correct.
        if (!ISafeProtocolModule(msg.sender).requiresRootAccess()) {
            revert ModuleRequiresRootAccess(msg.sender);
        }

        if (nonces[msg.sender] != rootAccess.nonce) {
            revert InvalidNonce(msg.sender, rootAccess.nonce);
        }

        nonces[msg.sender]++;
        data = "";
        success = safe.execTransactionFromModule(safeProtocolAction.to, safeProtocolAction.value, safeProtocolAction.data, 1);
    }
}
