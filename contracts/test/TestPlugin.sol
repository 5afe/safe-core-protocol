// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {IAccount} from "../interfaces/Accounts.sol";
import {ISafeProtocolPlugin} from "../interfaces/Modules.sol";
import {ISafeProtocolManager} from "../interfaces/Manager.sol";
import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";
import {PLUGIN_PERMISSION_NONE, PLUGIN_PERMISSION_EXECUTE_CALL, PLUGIN_PERMISSION_EXECUTE_DELEGATECALL} from "../common/Constants.sol";

abstract contract BaseTestPlugin is ISafeProtocolPlugin {
    string public name = "";
    string public version = "";
    uint8 public permissions = PLUGIN_PERMISSION_NONE;

    function metadataProvider() external view override returns (uint256 providerType, bytes memory location) {}

    function setRequiresPermissions(uint8 _requiresPermission) external {
        permissions = _requiresPermission;
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(ISafeProtocolPlugin).interfaceId || interfaceId == 0x01ffc9a7;
    }

    function requiresPermissions() external view override returns (uint8) {
        return permissions;
    }
}

contract TestPlugin is BaseTestPlugin {
    constructor() {
        permissions = PLUGIN_PERMISSION_EXECUTE_CALL;
    }

    function executeFromPlugin(
        ISafeProtocolManager manager,
        address account,
        SafeTransaction calldata safetx
    ) external returns (bytes[] memory data) {
        (data) = manager.executeTransaction(account, safetx);
    }
}

contract TestPluginWithRootAccess is TestPlugin {
    constructor() {
        permissions = PLUGIN_PERMISSION_EXECUTE_DELEGATECALL;
    }

    function executeRootAccessTxFromPlugin(
        ISafeProtocolManager manager,
        address account,
        SafeRootAccess calldata safeRootAccesstx
    ) external returns (bytes memory data) {
        (data) = manager.executeRootAccess(account, safeRootAccesstx);
    }
}
