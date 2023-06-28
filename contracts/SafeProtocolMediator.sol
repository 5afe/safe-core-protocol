// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolMediator} from "./interfaces/Mediator.sol";
import {ISafeProtocolModule} from "./interfaces/Components.sol";

import {ISafe} from "./interfaces/Accounts.sol";
import {SafeProtocolAction, SafeTransaction, SafeRootAccess} from "./DataTypes.sol";
import {ISafeProtocolRegistry} from "./interfaces/Registry.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title SafeProtocolMediator contract allows Safe users to set module through a Mediator rather than directly enabling a module on Safe.
 *        Users have to first enable SafeProtocolMediator as a module on a Safe and then enable other modules through the mediator.
 *        TODO: Add more description on behaviour of the contract.
 */
contract SafeProtocolMediator is ISafeProtocolMediator, Ownable2Step {
    address internal constant SENTINEL_MODULES = address(0x1);

    /**
     * @notice Mapping of a mapping what stores information about modules that are enabled per Safe.
     *         address (Safe address) => address (component address) => EnabledMoudleInfo
     */
    mapping(address => mapping(address => ModuleAccessInfo)) public enabledComponents;
    address public registry;
    struct ModuleAccessInfo {
        bool enabled;
        bool rootAddressGranted;
        address nextModulePointer;
        // TODO: Add deadline for validity
    }

    // Events
    event ActionsExecuted(address safe, bytes32 metaHash, uint256 nonce);
    event RootAccessActionExecuted(address safe, bytes32 metaHash);
    event ModuleEnabled(address safe, address module, bool allowRootAccess);
    event ModuleDisabled(address safe, address module);
    event RegistryChanged(address oldRegistry, address newRegistry);

    // Errors
    error ModuleRequiresRootAccess(address sender);
    error MoudleNotEnabled(address module);
    error ModuleEnabledOnlyForRootAccess(address module);
    error ModuleAccessMismatch(address module, bool requiresRootAccess, bool providedValue);
    error ActionExecutionFailed(address safe, bytes32 metaHash, uint256 index);
    error RootAccessActionExecutionFailed(address safe, bytes32 metaHash);
    error ModuleAlreadyEnabled(address safe, address module);
    error InvalidModuleAddress(address module);
    error ModuleNotPermitted(address module, uint64 listedAt, uint64 flaggedAt);
    error InvalidPrevModuleAddress(address module);
    error ZeroPageSizeNotAllowed();

    modifier onlyEnabledModule(ISafe safe) {
        if (!enabledComponents[address(safe)][msg.sender].enabled) {
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

    modifier onlyPermittedModule(address module) {
        // Only allow registered and non-flagged modules
        (uint64 listedAt, uint64 flaggedAt) = ISafeProtocolRegistry(registry).check(module);
        if (listedAt == 0 || flaggedAt != 0) {
            revert ModuleNotPermitted(module, listedAt, flaggedAt);
        }
        _;
    }

    constructor(address initialOwner, address _registry) {
        _transferOwnership(initialOwner);
        registry = _registry;
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
    ) external override onlyEnabledModule(safe) onlyPermittedModule(msg.sender) returns (bytes[] memory data) {
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
                data[i] = resultData;
            }
        }

        emit ActionsExecuted(address(safe), transaction.metaHash, transaction.nonce);
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
    ) external override onlyEnabledModule(safe) onlyPermittedModule(msg.sender) returns (bytes memory data) {
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
    function enableModule(address module, bool allowRootAccess) external noZeroOrSentinelModule(module) onlyPermittedModule(module) {
        // TODO: Check if module is a valid address and implements valid interface.
        //       Validate if caller is a Safe.

        if (enabledComponents[msg.sender][module].enabled) {
            revert ModuleAlreadyEnabled(msg.sender, module);
        }

        bool requiresRootAccess = ISafeProtocolModule(module).requiresRootAccess();
        if (allowRootAccess != requiresRootAccess) {
            revert ModuleAccessMismatch(module, requiresRootAccess, allowRootAccess);
        }

        if (enabledComponents[msg.sender][SENTINEL_MODULES].nextModulePointer == address(0)) {
            // The circular linked list has not been initialised yet for msg.sender. So, do it now.
            enabledComponents[msg.sender][SENTINEL_MODULES] = ModuleAccessInfo(false, false, SENTINEL_MODULES);
        }

        enabledComponents[msg.sender][address(module)] = ModuleAccessInfo(
            true,
            allowRootAccess,
            enabledComponents[msg.sender][SENTINEL_MODULES].nextModulePointer
        );
        enabledComponents[msg.sender][SENTINEL_MODULES] = ModuleAccessInfo(false, false, address(module));

        emit ModuleEnabled(msg.sender, address(module), allowRootAccess);
    }

    /**
     * @notice Disable a module. This function should be called by Safe.
     * @param module Module to be disabled
     */
    function disableModule(address prevModule, address module) external noZeroOrSentinelModule(module) {
        // TODO: Validate if caller is a Safe

        if (enabledComponents[msg.sender][prevModule].nextModulePointer != module) {
            revert InvalidPrevModuleAddress(prevModule);
        }

        enabledComponents[msg.sender][prevModule] = enabledComponents[msg.sender][module];

        enabledComponents[msg.sender][module] = ModuleAccessInfo(false, false, address(0));
        emit ModuleDisabled(msg.sender, module);
    }

    /**
     * @notice A view only function to get information about safe and a module
     * @param safe Address of a safe
     * @param module Address of a module
     */
    function getModuleInfo(address safe, address module) external view returns (ModuleAccessInfo memory enabled) {
        return enabledComponents[safe][module];
    }

    /**
     * @notice Returns if an module is enabled
     * @return True if the module is enabled
     */
    function isModuleEnabled(address safe, address module) public view returns (bool) {
        return SENTINEL_MODULES != module && enabledComponents[safe][module].enabled;
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
        next = enabledComponents[safe][start].nextModulePointer;
        while (next != address(0) && next != SENTINEL_MODULES && moduleCount < pageSize) {
            array[moduleCount] = next;
            next = enabledComponents[safe][next].nextModulePointer;
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

    function setRegistry(address newRegistry) external onlyOwner {
        emit RegistryChanged(registry, newRegistry);
        registry = newRegistry;
    }
}
