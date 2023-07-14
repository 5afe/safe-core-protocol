// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolManager} from "./interfaces/Manager.sol";
import {ISafeProtocolPlugin, ISafeProtocolHooks} from "./interfaces/Integrations.sol";

import {ISafe} from "./interfaces/Accounts.sol";
import {SafeProtocolAction, SafeTransaction, SafeRootAccess} from "./DataTypes.sol";
import {ISafeProtocolRegistry} from "./interfaces/Registry.sol";
import {RegistryManager} from "./base/RegistryManager.sol";
import {HooksManager} from "./base/HooksManager.sol";

/**
 * @title SafeProtocolManager contract allows Safe users to set plugin through a Manager rather than directly enabling a plugin on Safe.
 *        Users have to first enable SafeProtocolManager as a plugin on a Safe and then enable other plugins through the mediator.
 */
contract SafeProtocolManager is ISafeProtocolManager, RegistryManager, HooksManager {
    address internal constant SENTINEL_MODULES = address(0x1);

    /**
     * @notice Mapping of a mapping what stores information about plugins that are enabled per Safe.
     *         address (Safe address) => address (integration address) => EnabledPluginInfo
     */
    mapping(address => mapping(address => PluginAccessInfo)) public enabledPlugins;
    struct PluginAccessInfo {
        bool rootAddressGranted;
        address nextPluginPointer;
    }

    // Events
    event ActionsExecuted(address indexed safe, bytes32 metadataHash, uint256 nonce);
    event RootAccessActionExecuted(address indexed safe, bytes32 metadataHash);
    event PluginEnabled(address indexed safe, address indexed plugin, bool allowRootAccess);
    event PluginDisabled(address indexed safe, address indexed plugin);

    // Errors
    error PluginRequiresRootAccess(address sender);
    error PluginNotEnabled(address plugin);
    error PluginEnabledOnlyForRootAccess(address plugin);
    error PluginAccessMismatch(address plugin, bool requiresRootAccess, bool providedValue);
    error ActionExecutionFailed(address safe, bytes32 metadataHash, uint256 index);
    error RootAccessActionExecutionFailed(address safe, bytes32 metadataHash);
    error PluginAlreadyEnabled(address safe, address plugin);
    error InvalidPluginAddress(address plugin);
    error InvalidPrevPluginAddress(address plugin);
    error ZeroPageSizeNotAllowed();
    error InvalidToFieldInSafeProtocolAction(address safe, bytes32 metadataHash, uint256 index);

    modifier onlyEnabledPlugin(address safe) {
        if (enabledPlugins[safe][msg.sender].nextPluginPointer == address(0)) {
            revert PluginNotEnabled(msg.sender);
        }
        _;
    }

    modifier noZeroOrSentinelPlugin(address plugin) {
        if (plugin == address(0) || plugin == SENTINEL_MODULES) {
            revert InvalidPluginAddress(plugin);
        }
        _;
    }

    constructor(address initialOwner, address _registry) RegistryManager(_registry, initialOwner) {}

    /**
     * @notice This function executes non-delegate call(s) on a safe if the plugin is enabled on the Safe.
     *         If any one of the actions fail, the transaction reverts.
     * @dev Restrict the `to` field in the actions so that a module cannot execute an action that changes the config such as
     *      enabling/disabling other modules or make changes to its own access level for a Safe.
     *      In future, evaluate use of fine granined permissions model executing actions.
     *      For more information, follow the disuccsion here: https://github.com/5afe/safe-protocol-specs/discussions/7.
     * @param safe A Safe instance
     * @param transaction A struct of type SafeTransaction containing information of about the action(s) to be executed.
     *                    Users can add logic to validate metadataHash through hooks.
     * @return data bytes types containing the result of the executed action.
     */
    function executeTransaction(
        ISafe safe,
        SafeTransaction calldata transaction
    ) external override onlyEnabledPlugin(address(safe)) onlyPermittedPlugin(msg.sender) returns (bytes[] memory data) {
        address safeAddress = address(safe);

        address hooksAddress = enabledHooks[safeAddress];
        bool areHooksEnabled = hooksAddress != address(0);
        bytes memory preCheckData;
        if (areHooksEnabled) {
            // TODO: Define execution metadata
            // executionType = 1 for plugin flow
            preCheckData = ISafeProtocolHooks(hooksAddress).preCheck(safe, transaction, 1, "");
        }

        data = new bytes[](transaction.actions.length);
        uint256 length = transaction.actions.length;
        for (uint256 i = 0; i < length; ++i) {
            SafeProtocolAction calldata safeProtocolAction = transaction.actions[i];

            if (safeProtocolAction.to == address(this) || safeProtocolAction.to == safeAddress) {
                revert InvalidToFieldInSafeProtocolAction(safeAddress, transaction.metadataHash, i);
            }

            (bool isActionSuccessful, bytes memory resultData) = safe.execTransactionFromModuleReturnData(
                safeProtocolAction.to,
                safeProtocolAction.value,
                safeProtocolAction.data,
                0
            );

            // Even if one action fails, revert the transaction.
            if (!isActionSuccessful) {
                revert ActionExecutionFailed(safeAddress, transaction.metadataHash, i);
            } else {
                data[i] = resultData;
            }
        }
        if (areHooksEnabled) {
            // success = true because if transaction is not revereted till here, all actions executed successfully.
            ISafeProtocolHooks(hooksAddress).postCheck(ISafe(safe), true, preCheckData);
        }
        emit ActionsExecuted(safeAddress, transaction.metadataHash, transaction.nonce);
    }

    /**
     * @notice This function executes a delegate call on a safe if the plugin is enabled and
     *         root access it granted.
     * @param safe A Safe instance
     * @param rootAccess A struct of type SafeRootAccess containing information of about the action to be executed.
     *                   Users can add logic to validate metadataHash through hooks.
     * @return data bytes types containing the result of the executed action.
     */
    function executeRootAccess(
        ISafe safe,
        SafeRootAccess calldata rootAccess
    ) external override onlyEnabledPlugin(address(safe)) onlyPermittedPlugin(msg.sender) returns (bytes memory data) {
        SafeProtocolAction calldata safeProtocolAction = rootAccess.action;
        address safeAddress = address(safe);

        address hooksAddress = enabledHooks[safeAddress];
        bool areHooksEnabled = hooksAddress != address(0);
        bytes memory preCheckData;
        if (areHooksEnabled) {
            // TODO: Define execution metadata
            // executionType = 1 for plugin flow
            preCheckData = ISafeProtocolHooks(hooksAddress).preCheckRootAccess(safe, rootAccess, 1, "");
        }
        if (!ISafeProtocolPlugin(msg.sender).requiresRootAccess() || !enabledPlugins[safeAddress][msg.sender].rootAddressGranted) {
            revert PluginRequiresRootAccess(msg.sender);
        }

        bool success;
        (success, data) = safe.execTransactionFromModuleReturnData(
            safeProtocolAction.to,
            safeProtocolAction.value,
            safeProtocolAction.data,
            1
        );

        if (areHooksEnabled) {
            // success = true because if transaction is not revereted till here, all actions executed successfully.
            ISafeProtocolHooks(hooksAddress).postCheck(ISafe(safe), success, preCheckData);
        }

        if (success) {
            emit RootAccessActionExecuted(safeAddress, rootAccess.metadataHash);
        } else {
            revert RootAccessActionExecutionFailed(safeAddress, rootAccess.metadataHash);
        }
    }

    /**
     * @notice Called by a Safe to enable a plugin on a Safe. To be called by a safe.
     * @param plugin ISafeProtocolPlugin A plugin that has to be enabled
     * @param allowRootAccess Bool indicating whether root access to be allowed.
     */
    function enablePlugin(address plugin, bool allowRootAccess) external noZeroOrSentinelPlugin(plugin) onlyPermittedPlugin(plugin) {
        PluginAccessInfo storage senderSentinelPlugin = enabledPlugins[msg.sender][SENTINEL_MODULES];
        PluginAccessInfo storage senderPlugin = enabledPlugins[msg.sender][plugin];

        if (senderPlugin.nextPluginPointer != address(0)) {
            revert PluginAlreadyEnabled(msg.sender, plugin);
        }

        bool requiresRootAccess = ISafeProtocolPlugin(plugin).requiresRootAccess();
        if (allowRootAccess != requiresRootAccess) {
            revert PluginAccessMismatch(plugin, requiresRootAccess, allowRootAccess);
        }

        if (senderSentinelPlugin.nextPluginPointer == address(0)) {
            senderSentinelPlugin.rootAddressGranted = false;
            senderSentinelPlugin.nextPluginPointer = SENTINEL_MODULES;
        }

        senderPlugin.nextPluginPointer = senderSentinelPlugin.nextPluginPointer;
        senderPlugin.rootAddressGranted = allowRootAccess;
        senderSentinelPlugin.nextPluginPointer = plugin;

        emit PluginEnabled(msg.sender, plugin, allowRootAccess);
    }

    /**
     * @notice Disable a plugin. This function should be called by Safe.
     * @param plugin Plugin to be disabled
     */
    function disablePlugin(address prevPlugin, address plugin) external noZeroOrSentinelPlugin(plugin) {
        PluginAccessInfo storage prevPluginInfo = enabledPlugins[msg.sender][prevPlugin];
        PluginAccessInfo storage pluginInfo = enabledPlugins[msg.sender][plugin];

        if (prevPluginInfo.nextPluginPointer != plugin) {
            revert InvalidPrevPluginAddress(prevPlugin);
        }

        prevPluginInfo = pluginInfo;

        pluginInfo.nextPluginPointer = address(0);
        pluginInfo.rootAddressGranted = false;
        emit PluginDisabled(msg.sender, plugin);
    }

    /**
     * @notice A view only function to get information about safe and a plugin
     * @param safe Address of a safe
     * @param plugin Address of a plugin
     */
    function getPluginInfo(address safe, address plugin) external view returns (PluginAccessInfo memory enabled) {
        return enabledPlugins[safe][plugin];
    }

    /**
     * @notice Returns if an plugin is enabled
     * @return True if the plugin is enabled
     */
    function isPluginEnabled(address safe, address plugin) public view returns (bool) {
        return SENTINEL_MODULES != plugin && enabledPlugins[safe][plugin].nextPluginPointer != address(0);
    }

    /**
     * @notice Returns an array of plugins enabled for a Safe address.
     *         If all entries fit into a single page, the next pointer will be 0x1.
     *         If another page is present, next will be the last element of the returned array.
     * @param start Start of the page. Has to be a plugin or start pointer (0x1 address)
     * @param pageSize Maximum number of plugins that should be returned. Has to be > 0
     * @return array Array of plugins.
     * @return next Start of the next page.
     */
    function getPluginsPaginated(
        address start,
        uint256 pageSize,
        address safe
    ) external view returns (address[] memory array, address next) {
        if (pageSize == 0) {
            revert ZeroPageSizeNotAllowed();
        }

        if (!(start == SENTINEL_MODULES || isPluginEnabled(safe, start))) {
            revert InvalidPluginAddress(start);
        }
        // Init array with max page size
        array = new address[](pageSize);

        // Populate return array
        uint256 pluginCount = 0;
        next = enabledPlugins[safe][start].nextPluginPointer;
        while (next != address(0) && next != SENTINEL_MODULES && pluginCount < pageSize) {
            array[pluginCount] = next;
            next = enabledPlugins[safe][next].nextPluginPointer;
            pluginCount++;
        }

        // This check is required because the enabled plugin list might not be initialised yet. e.g. no enabled plugins for a safe ever before
        if (pluginCount == 0) {
            next = SENTINEL_MODULES;
        }

        /**
          Because of the argument validation, we can assume that the loop will always iterate over the valid plugin list values
          and the `next` variable will either be an enabled plugin or a sentinel address (signalling the end). 
          
          If we haven't reached the end inside the loop, we need to set the next pointer to the last element of the plugins array
          because the `next` variable (which is a plugin by itself) acting as a pointer to the start of the next page is neither 
          included to the current page, nor will it be included in the next one if you pass it as a start.
        */
        if (next != SENTINEL_MODULES && pluginCount != 0) {
            next = array[pluginCount - 1];
        }
        // Set correct size of returned array
        // solhint-disable-next-line no-inline-assembly
        assembly {
            mstore(array, pluginCount)
        }
    }
}
