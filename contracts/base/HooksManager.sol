// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolHooks} from "../interfaces/Integrations.sol";

import {RegistryManager} from "./RegistryManager.sol";
import {OnlyAccountCallable} from "./OnlyAccountCallable.sol";

abstract contract HooksManager is RegistryManager, OnlyAccountCallable {
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
    event HooksChanged(address indexed safe, address indexed hooksAddress);

    /**
     * @notice Returns the address of hooks for a Safe account provided as a fucntion parameter.
     *         Returns address(0) is no hooks are enabled.
     * @param safe Address of a Safe account
     * @return hooksAddress Address of hooks enabled for on Safe account
     */
    function getEnabledHooks(address safe) external view returns (address hooksAddress) {
        hooksAddress = enabledHooks[safe];
    }

    /**
     * @notice Sets hooks on an account. If Zero address is set, manager will not perform pre and post checks for on Safe transaction.
     * @param hooks Address of the hooks to be enabled for msg.sender.
     */
    function setHooks(address hooks) external onlyAccount {
        if (hooks != address(0)) {
            checkPermittedIntegration(hooks);
            if (!ISafeProtocolHooks(hooks).supportsInterface(type(ISafeProtocolHooks).interfaceId))
                revert AccountDoesNotImplementValidInterfaceId(hooks);
        }
        enabledHooks[msg.sender] = hooks;
        emit HooksChanged(msg.sender, hooks);
    }
}
