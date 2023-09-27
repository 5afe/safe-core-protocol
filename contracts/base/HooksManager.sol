// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolHooks} from "../interfaces/Modules.sol";

import {RegistryManager} from "./RegistryManager.sol";
import {OnlyAccountCallable} from "./OnlyAccountCallable.sol";
import {MODULE_TYPE_HOOKS} from "../common/Constants.sol";

abstract contract HooksManager is RegistryManager {
    mapping(address => address) public enabledHooks;

    struct TempHooksInfo {
        address hooksAddress;
        bytes preCheckData;
    }
    /// @notice This variable should store the address of the hooks contract whenever
    /// checkTransaction(...) is called and use it in checkAfterExecution(...) to avoid
    /// any side effects of changed hooks address inbetween transaction.
    mapping(address => TempHooksInfo) public tempHooksData;

    // Events
    event HooksChanged(address indexed account, address indexed hooksAddress);

    /**
     * @notice Returns the address of hooks for an account provided as a function parameter.
     *         Returns address(0) is no hooks are enabled.
     * @param account Address of an account
     * @return hooksAddress Address of hooks enabled for the account
     */
    function getEnabledHooks(address account) external view returns (address hooksAddress) {
        hooksAddress = enabledHooks[account];
    }

    /**
     * @notice Sets hooks on an account. If Zero address is set, manager will not perform pre and post checks for account transactions.
     * @param hooks Address of the hooks to be enabled for msg.sender.
     */
    function setHooks(address hooks) external onlyAccount {
        if (hooks != address(0)) {
            checkPermittedModule(hooks, MODULE_TYPE_HOOKS);
            if (!ISafeProtocolHooks(hooks).supportsInterface(type(ISafeProtocolHooks).interfaceId))
                revert ContractDoesNotImplementValidInterfaceId(hooks);
        }
        enabledHooks[msg.sender] = hooks;
        emit HooksChanged(msg.sender, hooks);
    }
}
