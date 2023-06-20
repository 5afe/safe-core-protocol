// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {ISafe} from "../interfaces/Accounts.sol";
import {ISafeProtocolModule} from "../interfaces/Components.sol";

abstract contract BaseTestModule is ISafeProtocolModule {
    string public name = "";
    string public version = "";
    bool public requiresRootAccess = false;

    function metaProvider() external view override returns (uint256 providerType, bytes memory location) {}
}

contract TestModule is BaseTestModule {
    function executeFromModule(ISafe safe, address payable to, uint256 value,bytes calldata data) external {
        safe.execTransactionFromModule(to, value, data, 0);
    }
}

contract TestModuleWithRootAccess is BaseTestModule {
    constructor() {
        requiresRootAccess = true;
    }

    function executeFromModule(ISafe safe, address payable to, uint256 value, bytes calldata data) external {
        safe.execTransactionFromModule(to, value, data, 1);
    }
}
