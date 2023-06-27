// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolMediator} from "./interfaces/Mediator.sol";
import {ISafeProtocolModule} from "./interfaces/Components.sol";

import {ISafe} from "./interfaces/Accounts.sol";
import {SafeProtocolAction, SafeTransaction, SafeRootAccess} from "./DataTypes.sol";

/**
 * @title SafeProtocolMediator contract allows Safe users to set module through a Mediator rather than directly enabling a module on Safe.
 *        Users have to first enable SafeProtocolMediator as a module on a Safe and then enable other modules through the mediator.
 *        TODO: Add more description on behaviour of the contract.
 */
contract SafeProtocolMediator is ISafeProtocolMediator {
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
    event ActionExecuted(address safe, bytes32 metaHash, uint256 index);
    event RootAccessActionExecuted(address safe, bytes32 metaHash);
    event ModuleEnabled(address safe, address module, bool allowRootAccess);
    event ModuleDisabled(address safe, address module);

    // Errors
    error ModuleRequiresRootAccess(address sender);
    error MoudleNotEnabled(address module);
    error ModuleEnabledOnlyForRootAccess(address module);
    error ModuleAccessMismatch(address module, bool requiresRootAccess, bool providedValue);
    error ActionExecutionFailed(address safe, bytes32 metaHash, uint256 index);
    error RootAccessActionExecutionFailed(address safe, bytes32 metaHash);

    modifier onlyEnabledModule(ISafe safe) {
        if (!enabledComponents[address(safe)][msg.sender].enabled) {
            revert MoudleNotEnabled(msg.sender);
        }
        _;
    }

    /**
     * @notice This function executes a delegate call on a safe if the module is enabled and
     *         root access it granted.
     * @param safe A Safe instance
     * @param transaction A struct of type SafeTransaction containing information of about the action(s) to be executed.
     *                    Users can add logic to validate metahash through a transaction guard.
     * @return data bytes types containing the result of the executed action.
     */
    function executeTransaction(
        ISafe safe,
        SafeTransaction calldata transaction
    ) external override onlyEnabledModule(safe) returns (bytes[] memory data) {
        // TODO: Check for re-entrancy attacks

        data = new bytes[](transaction.actions.length);
        for (uint256 i = 0; i < transaction.actions.length; ++i) {
            SafeProtocolAction memory safeProtocolAction = transaction.actions[i];
            (bool isActionSuccessful, bytes memory resultData) = safe.execTransactionFromModuleReturnData(
                safeProtocolAction.to,
                safeProtocolAction.value,
                safeProtocolAction.data,
                0
            );

            // Need to revisit the approach below. If some actions fail, the transaction stiil succeeds.
            // With current approach, even if one action fails, `data` will be empty bytes even for successful
            // actions.
            if (!isActionSuccessful) {
                revert ActionExecutionFailed(address(safe), transaction.metaHash, i);
            } else {
                emit ActionExecuted(address(safe), transaction.metaHash, i);
                data[i] = resultData;
            }
        }
    }

    /**
     * @notice This function executes a delegate call on a safe if the module is enabled and
     *         root access it granted.
     * @param safe A Safe instance
     * @param rootAccess A struct of type SafeRootAccess containing information of about the action to be executed.
     *                   Users can add logic to validate metahash through a transaction guard.
     * @return data bytes types containing the result of the executed action.
     */
    function executeRootAccess(
        ISafe safe,
        SafeRootAccess calldata rootAccess
    ) external override onlyEnabledModule(safe) returns (bytes memory data) {
        SafeProtocolAction memory safeProtocolAction = rootAccess.action;
        // TODO: Check for re-entrancy attacks

        if (!ISafeProtocolModule(msg.sender).requiresRootAccess() || !enabledComponents[address(safe)][msg.sender].rootAddressGranted) {
            revert ModuleRequiresRootAccess(msg.sender);
        }

        bool success;
        (success, data) = safe.execTransactionFromModuleReturnData(
            safeProtocolAction.to,
            safeProtocolAction.value,
            safeProtocolAction.data,
            1
        );
        if (success) {
            emit RootAccessActionExecuted(address(safe), rootAccess.metaHash);
        } else {
            revert RootAccessActionExecutionFailed(address(safe), rootAccess.metaHash);
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
