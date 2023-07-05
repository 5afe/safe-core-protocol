// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolMediator} from "./interfaces/Mediator.sol";
import {ISafeProtocolModule, ISafeProtocolGuard} from "./interfaces/Components.sol";

import {ISafe} from "./interfaces/Accounts.sol";
import {SafeProtocolAction, SafeTransaction, SafeRootAccess} from "./DataTypes.sol";
import {ISafeProtocolRegistry} from "./interfaces/Registry.sol";
import {RegistryManager} from "./base/RegistryManager.sol";
import {GuardManager} from "./base/GuardManager.sol";

/**
 * @title SafeProtocolMediator contract allows Safe users to set module through a Mediator rather than directly enabling a module on Safe.
 *        Users have to first enable SafeProtocolMediator as a module on a Safe and then enable other modules through the mediator.
 */
contract SafeProtocolMediator is ISafeProtocolMediator, RegistryManager, GuardManager {
    address internal constant SENTINEL_MODULES = address(0x1);

    /**
     * @notice Mapping of a mapping what stores information about modules that are enabled per Safe.
     *         address (Safe address) => address (component address) => EnabledModuleInfo
     */
    mapping(address => mapping(address => ModuleAccessInfo)) public enabledModules;
    struct ModuleAccessInfo {
        bool rootAddressGranted;
        address nextModulePointer;
    }

    // Events
    event ActionsExecuted(address indexed safe, bytes32 metaHash, uint256 nonce);
    event RootAccessActionExecuted(address indexed safe, bytes32 metaHash);
    event ModuleEnabled(address indexed safe, address indexed module, bool allowRootAccess);
    event ModuleDisabled(address indexed safe, address indexed module);

    // Errors
    error ModuleRequiresRootAccess(address sender);
    error MoudleNotEnabled(address module);
    error ModuleEnabledOnlyForRootAccess(address module);
    error ModuleAccessMismatch(address module, bool requiresRootAccess, bool providedValue);
    error ActionExecutionFailed(address safe, bytes32 metaHash, uint256 index);
    error RootAccessActionExecutionFailed(address safe, bytes32 metaHash);
    error ModuleAlreadyEnabled(address safe, address module);
    error InvalidModuleAddress(address module);
    error InvalidPrevModuleAddress(address module);
    error ZeroPageSizeNotAllowed();

    modifier onlyEnabledModule(address safe) {
        if (enabledModules[safe][msg.sender].nextModulePointer == address(0)) {
            revert MoudleNotEnabled(msg.sender);
        }
        _;
    }

    modifier noZeroOrSentinelModule(address module) {
        if (module == address(0) || module == SENTINEL_MODULES) {
            revert InvalidModuleAddress(module);
        }
        _;
    }

    constructor(address initialOwner, address _registry) RegistryManager(_registry, initialOwner) {}

    /**
     * @notice This function executes non-delegate call(s) on a safe if the module is enabled on the Safe.
     *         If any one of the actions fail, the transaction reverts.
     * @param safe A Safe instance
     * @param transaction A struct of type SafeTransaction containing information of about the action(s) to be executed.
     *                    Users can add logic to validate metahash through a transaction guard.
     * @return data bytes types containing the result of the executed action.
     */
    function executeTransaction(
        ISafe safe,
        SafeTransaction calldata transaction
    ) external override onlyEnabledModule(address(safe)) onlyPermittedModule(msg.sender) returns (bytes[] memory data) {
        address safeAddress = address(safe);

        address guardAddress = enabledGuard[safeAddress];
        bool isGuardEnabled = guardAddress != address(0);
        bytes memory preCheckData;
        if (isGuardEnabled) {
            // TODO: Define execution meta
            // executionType = 1 for module flow
            preCheckData = ISafeProtocolGuard(guardAddress).preCheck(safe, transaction, 1, "");
        }

        data = new bytes[](transaction.actions.length);
        uint256 length = transaction.actions.length;
        for (uint256 i = 0; i < length; ++i) {
            SafeProtocolAction calldata safeProtocolAction = transaction.actions[i];
            (bool isActionSuccessful, bytes memory resultData) = safe.execTransactionFromModuleReturnData(
                safeProtocolAction.to,
                safeProtocolAction.value,
                safeProtocolAction.data,
                0
            );

            // Even if one action fails, revert the transaction.
            if (!isActionSuccessful) {
                revert ActionExecutionFailed(safeAddress, transaction.metaHash, i);
            } else {
                data[i] = resultData;
            }
        }
        if (isGuardEnabled) {
            // TODO: Define execution meta
            // success = true because if transaction is not revereted till here, all actions executed successfully.
            ISafeProtocolGuard(guardAddress).postCheck(ISafe(safe), true, preCheckData);
        }
        emit ActionsExecuted(safeAddress, transaction.metaHash, transaction.nonce);
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
    ) external override onlyEnabledModule(address(safe)) onlyPermittedModule(msg.sender) returns (bytes memory data) {
        SafeProtocolAction calldata safeProtocolAction = rootAccess.action;
        address safeAddress = address(safe);

        address guardAddress = enabledGuard[safeAddress];
        bool isGuardEnabled = guardAddress != address(0);
        bytes memory preCheckData;
        if (isGuardEnabled) {
            // TODO: Define execution meta
            // executionType = 1 for module flow
            preCheckData = ISafeProtocolGuard(guardAddress).preCheckRootAccess(safe, rootAccess, 1, "");
        }
        if (!ISafeProtocolModule(msg.sender).requiresRootAccess() || !enabledModules[safeAddress][msg.sender].rootAddressGranted) {
            revert ModuleRequiresRootAccess(msg.sender);
        }

        bool success;
        (success, data) = safe.execTransactionFromModuleReturnData(
            safeProtocolAction.to,
            safeProtocolAction.value,
            safeProtocolAction.data,
            1
        );

        if (isGuardEnabled) {
            // TODO: Define execution meta
            // success = true because if transaction is not revereted till here, all actions executed successfully.
            ISafeProtocolGuard(guardAddress).postCheck(ISafe(safe), success, preCheckData);
        }

        if (success) {
            emit RootAccessActionExecuted(safeAddress, rootAccess.metaHash);
        } else {
            revert RootAccessActionExecutionFailed(safeAddress, rootAccess.metaHash);
        }
    }

    /**
     * @notice Called by a Safe to enable a module on a Safe. To be called by a safe.
     * @param module ISafeProtocolModule A module that has to be enabled
     * @param allowRootAccess Bool indicating whether root access to be allowed.
     */
    function enableModule(address module, bool allowRootAccess) external noZeroOrSentinelModule(module) onlyPermittedModule(module) {
        ModuleAccessInfo storage senderSentinelModule = enabledModules[msg.sender][SENTINEL_MODULES];
        ModuleAccessInfo storage senderModule = enabledModules[msg.sender][module];

        if (senderModule.nextModulePointer != address(0)) {
            revert ModuleAlreadyEnabled(msg.sender, module);
        }

        bool requiresRootAccess = ISafeProtocolModule(module).requiresRootAccess();
        if (allowRootAccess != requiresRootAccess) {
            revert ModuleAccessMismatch(module, requiresRootAccess, allowRootAccess);
        }

        if (senderSentinelModule.nextModulePointer == address(0)) {
            senderSentinelModule.rootAddressGranted = false;
            senderSentinelModule.nextModulePointer = SENTINEL_MODULES;
        }

        senderModule.nextModulePointer = senderSentinelModule.nextModulePointer;
        senderModule.rootAddressGranted = allowRootAccess;
        senderSentinelModule.nextModulePointer = module;

        emit ModuleEnabled(msg.sender, module, allowRootAccess);
    }

    /**
     * @notice Disable a module. This function should be called by Safe.
     * @param module Module to be disabled
     */
    function disableModule(address prevModule, address module) external noZeroOrSentinelModule(module) {
        ModuleAccessInfo storage prevModuleInfo = enabledModules[msg.sender][prevModule];
        ModuleAccessInfo storage moduleInfo = enabledModules[msg.sender][module];

        if (prevModuleInfo.nextModulePointer != module) {
            revert InvalidPrevModuleAddress(prevModule);
        }

        prevModuleInfo = moduleInfo;

        moduleInfo.nextModulePointer = address(0);
        moduleInfo.rootAddressGranted = false;
        emit ModuleDisabled(msg.sender, module);
    }

    /**
     * @notice A view only function to get information about safe and a module
     * @param safe Address of a safe
     * @param module Address of a module
     */
    function getModuleInfo(address safe, address module) external view returns (ModuleAccessInfo memory enabled) {
        return enabledModules[safe][module];
    }

    /**
     * @notice Returns if an module is enabled
     * @return True if the module is enabled
     */
    function isModuleEnabled(address safe, address module) public view returns (bool) {
        return SENTINEL_MODULES != module && enabledModules[safe][module].nextModulePointer != address(0);
    }

    /**
     * @notice Returns an array of modules enabled for a Safe address.
     *         If all entries fit into a single page, the next pointer will be 0x1.
     *         If another page is present, next will be the last element of the returned array.
     * @param start Start of the page. Has to be a module or start pointer (0x1 address)
     * @param pageSize Maximum number of modules that should be returned. Has to be > 0
     * @return array Array of modules.
     * @return next Start of the next page.
     */
    function getModulesPaginated(
        address start,
        uint256 pageSize,
        address safe
    ) external view returns (address[] memory array, address next) {
        if (pageSize == 0) {
            revert ZeroPageSizeNotAllowed();
        }

        if (!(start == SENTINEL_MODULES || isModuleEnabled(safe, start))) {
            revert InvalidModuleAddress(start);
        }
        // Init array with max page size
        array = new address[](pageSize);

        // Populate return array
        uint256 moduleCount = 0;
        next = enabledModules[safe][start].nextModulePointer;
        while (next != address(0) && next != SENTINEL_MODULES && moduleCount < pageSize) {
            array[moduleCount] = next;
            next = enabledModules[safe][next].nextModulePointer;
            moduleCount++;
        }

        // This check is required because the enabled module list might not be initialised yet. e.g. no enabled modules for a safe ever before
        if (moduleCount == 0) {
            next = SENTINEL_MODULES;
        }

        /**
          Because of the argument validation, we can assume that the loop will always iterate over the valid module list values
          and the `next` variable will either be an enabled module or a sentinel address (signalling the end). 
          
          If we haven't reached the end inside the loop, we need to set the next pointer to the last element of the modules array
          because the `next` variable (which is a module by itself) acting as a pointer to the start of the next page is neither 
          included to the current page, nor will it be included in the next one if you pass it as a start.
        */
        if (next != SENTINEL_MODULES && moduleCount != 0) {
            next = array[moduleCount - 1];
        }
        // Set correct size of returned array
        // solhint-disable-next-line no-inline-assembly
        assembly {
            mstore(array, moduleCount)
        }
    }
}
