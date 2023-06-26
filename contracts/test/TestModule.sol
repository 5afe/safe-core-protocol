// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {ISafe} from "../interfaces/Accounts.sol";
import {ISafeProtocolModule} from "../interfaces/Components.sol";
import {ISafeProtocolMediator} from "../interfaces/Mediator.sol";
import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";

abstract contract BaseTestModule is ISafeProtocolModule {
    string public name = "";
    string public version = "";
    bool public requiresRootAccess = false;

    function metaProvider() external view override returns (uint256 providerType, bytes memory location) {}

    function setRequiresRootAccess(bool _requiresRootAccess) external {
        requiresRootAccess = _requiresRootAccess;
    }
}

contract TestModule is BaseTestModule {
    function executeFromModule(
        ISafeProtocolMediator mediator,
        ISafe safe,
        SafeTransaction calldata safetx
    ) external returns (bool success, bytes[] memory data) {
        (success, data) = mediator.executeTransaction(safe, safetx);
    }
}

contract TestModuleWithRootAccess is BaseTestModule {
    constructor() {
        requiresRootAccess = true;
    }

    function executeFromModule(
        ISafeProtocolMediator mediator,
        ISafe safe,
        SafeRootAccess calldata safeRootAccesstx
    ) external returns (bool success, bytes memory data) {
        (success, data) = mediator.executeRootAccess(safe, safeRootAccesstx);
    }
}
