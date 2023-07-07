// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolHook} from "../interfaces/Components.sol";

contract HookManager {
    mapping(address => address) public enabledHook;

    // Events
    event HookEnabled(address indexed safe, address indexed hookAddress);

    // Errors
    error AddressDoesNotImplementHookInterface(address hookAddress);

    /**
     * @notice Returns the address of a hook for a Safe account provided as a fucntion parameter.
     *         Returns address(0) is no hook is enabled.
     * @param safe Address of a Safe account
     * @return hookAddress Address of a hook enabled for on Safe account
     */
    function getEnabledHook(address safe) external view returns (address hookAddress) {
        hookAddress = enabledHook[safe];
    }

    /**
     * @notice Sets hook on an account. If Zero address is set, mediator will not perform pre and post checks for on Safe transaction.
     * @param hook Address of the hook to be enabled for msg.sender.
     */
    function setHook(address hook) external {
        if (hook != address(0) && !ISafeProtocolHook(hook).supportsInterface(type(ISafeProtocolHook).interfaceId)) {
            revert AddressDoesNotImplementHookInterface(hook);
        }
        enabledHook[msg.sender] = hook;
        emit HookEnabled(msg.sender, hook);
    }
}
