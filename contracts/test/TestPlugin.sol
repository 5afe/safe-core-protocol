// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {ISafe} from "../interfaces/Accounts.sol";
import {ISafeProtocolPlugin} from "../interfaces/Integrations.sol";
import {ISafeProtocolManager} from "../interfaces/Manager.sol";
import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";

abstract contract BaseTestPlugin is ISafeProtocolPlugin {
    string public name = "";
    string public version = "";
    bool public requiresRootAccess = false;

    function metadataProvider() external view override returns (uint256 providerType, bytes memory location) {}

    function setRequiresRootAccess(bool _requiresRootAccess) external {
        requiresRootAccess = _requiresRootAccess;
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(ISafeProtocolPlugin).interfaceId || interfaceId == 0x01ffc9a7;
    }
}

contract TestPlugin is BaseTestPlugin {
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
        requiresRootAccess = true;
    }

    function executeRootAccessTxFromPlugin(
        ISafeProtocolManager manager,
        ISafe safe,
        SafeRootAccess calldata safeRootAccesstx
    ) external returns (bytes memory data) {
        (data) = manager.executeRootAccess(safe, safeRootAccesstx);
    }
}
