// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolMediator} from "./interfaces/Mediator.sol";
import {ISafeProtocolModule} from "./interfaces/Components.sol";

import {ISafe} from "./interfaces/Accounts.sol";
import {SafeProtocolAction, SafeTransaction, SafeRootAccess} from "./DataTypes.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title TODO
 * @notice TODO
 */
contract SafeProtocolMediator is ISafeProtocolMediator, Ownable2Step {
    /**
     * @notice Mapping of a mapping what stores information about modules that are enabled per Safe.
     *         address (Safe address) => address (component address) => EnabledMoudleInfo
     */
    mapping(address => mapping(address => MoudleAccessInfo)) public enabledComponents;
    struct MoudleAccessInfo {
        bool enabled;
        bool rootAddressGranted;
        // TODO: Add deadline for validity
    }

    // Events
    event ActionsExecuted(address safe, bytes32 metaHash);
    event RootAccessActionExecuted(address safe, bytes32 metaHash);
    event ModuleEnabled(address safe, address module, bool allowRootAccess);
    event ModuleDisabled(address safe, address module);
    event ActionExecutionFailed(address safe, bytes32 metaHash, uint256 index);
    event RootAccessActionExecutionFailed(address safe, bytes32 metaHash);

    // Errors
    error ModuleRequiresRootAccess(address sender);
    error MoudleNotEnabled(address module);
    error ModuleEnabledOnlyForRootAccess(address module);
    error ModuleAccessMismatch(address module, bool requiresRootAccess, bool providedValue);

    constructor(address initalOwner) {
        _transferOwnership(initalOwner);
    }

    modifier onlyEnabledModule(ISafe safe) {
        if (!enabledComponents[address(safe)][msg.sender].enabled) {
            revert MoudleNotEnabled(msg.sender);
        }
        _;
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
    ) external override onlyEnabledModule(safe) returns (bool success, bytes[] memory data) {
        // TODO: Check for re-entrancy attacks
        // TODO: Validate metahash

        if (ISafeProtocolModule(msg.sender).requiresRootAccess()) {
            revert ModuleRequiresRootAccess(msg.sender);
        }

        if (enabledComponents[address(safe)][msg.sender].rootAddressGranted) {
            revert ModuleEnabledOnlyForRootAccess(msg.sender);
        }

        data = new bytes[](transaction.actions.length);
        success = true;
        for (uint256 i = 0; i < transaction.actions.length; ++i) {
            SafeProtocolAction memory safeProtocolAction = transaction.actions[i];
            (bool isActionSuccessful, bytes memory resultData) = safe.execTransactionFromModuleReturnData(
                safeProtocolAction.to,
                safeProtocolAction.value,
                safeProtocolAction.data,
                0
            );
            if (!isActionSuccessful) {
                success = false;
                // Return empty array on failed execution
                data = new bytes[](transaction.actions.length);
                emit ActionExecutionFailed(address(safe), transaction.metaHash, i);
                break;
            }
            data[i] = resultData;
        }

        if (success) {
            emit ActionsExecuted(address(safe), transaction.metaHash);
        }
    }

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
    ) external override onlyEnabledModule(safe) returns (bool success, bytes memory data) {
        SafeProtocolAction memory safeProtocolAction = rootAccess.action;
        // TODO: Check for re-entrancy attacks
        // TODO: Validate metahash

        // Re-confirm if this check if needed and correct.
        if (!ISafeProtocolModule(msg.sender).requiresRootAccess()) {
            revert ModuleRequiresRootAccess(msg.sender);
        }

        if (!enabledComponents[address(safe)][msg.sender].rootAddressGranted) {
            // TODO: Need new error type?
            revert ModuleRequiresRootAccess(msg.sender);
        }

        (success, data) = safe.execTransactionFromModuleReturnData(
            safeProtocolAction.to,
            safeProtocolAction.value,
            safeProtocolAction.data,
            1
        );
        if (success) {
            emit RootAccessActionExecuted(address(safe), rootAccess.metaHash);
        } else {
            emit RootAccessActionExecutionFailed(address(safe), rootAccess.metaHash);
        }
    }

    /**
     * @notice Called by a Safe to enable a module on a Safe. To be called by a safe.
     * @param module ISafeProtocolModule A module that has to be enabled
     * @param allowRootAccess Bool indicating whether root access to be allowed.
     */
    function enableModule(ISafeProtocolModule module, bool allowRootAccess) external {
        // TODO: Check if module is a valid address and implements valid interface.
        //       Validate if caller is a Safe.
        //       Should it be allowed to enable a module twice with different allowRootAccess flag?
        if (allowRootAccess != module.requiresRootAccess()) {
            revert ModuleAccessMismatch(address(module), module.requiresRootAccess(), allowRootAccess);
        }
        enabledComponents[msg.sender][address(module)] = MoudleAccessInfo(true, allowRootAccess);

        emit ModuleEnabled(msg.sender, address(module), allowRootAccess);
    }

    /**
     * @notice Disable a module. This function should be called by Safe.
     * @param module Module to be disabled
     */
    function disableModule(ISafeProtocolModule module) external {
        // TODO: Validate if caller is a Safe
        //       Should it be allowed to disable a non-enabled module?

        enabledComponents[msg.sender][address(module)] = MoudleAccessInfo(false, false);
        emit ModuleDisabled(msg.sender, address(module));
    }

    /**
     * @notice A view only function to get information about safe and a module
     * @param safe Address of a safe
     * @param module Address of a module
     */
    function getModuleInfo(address safe, address module) external view returns (MoudleAccessInfo memory enabled) {
        return enabledComponents[safe][module];
    }
}
