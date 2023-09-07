// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {ISafe} from "../interfaces/Accounts.sol";
import {ISafeProtocolPlugin} from "../interfaces/Modules.sol";
import {ISafeProtocolManager} from "../interfaces/Manager.sol";
import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";

abstract contract BaseTestPlugin is ISafeProtocolPlugin {
    string public name = "";
    string public version = "";
    uint8 public permissions = 0;

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
        permissions = 1;
    }

    function executeFromPlugin(
        ISafeProtocolManager manager,
        ISafe safe,
        SafeTransaction calldata safetx
    ) external returns (bytes[] memory data) {
        (data) = manager.executeTransaction(safe, safetx);
    }
}

contract TestPluginWithRootAccess is TestPlugin {
    constructor() {
        permissions = 4;
    }

    function executeRootAccessTxFromPlugin(
        ISafeProtocolManager manager,
        ISafe safe,
        SafeRootAccess calldata safeRootAccesstx
    ) external returns (bytes memory data) {
        (data) = manager.executeRootAccess(safe, safeRootAccesstx);
    }
}
