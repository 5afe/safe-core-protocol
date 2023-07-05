// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolGuard} from "../interfaces/Components.sol";

contract GuardManager {
    mapping(address => address) public enabledGuard;

    // Events
    event GuardEnabled(address indexed safe, address indexed guardAddress);

    // Errors
    error AddressDoesNotImplementGuardInterface(address guardAddress);

    /**
     * @notice Returns the address of a guard for a Safe account provided as a fucntion parameter.
     *         Returns address(0) is no guard is enabled.
     * @param safe Address of a Safe account
     * @return guardAddress Address of a guard enabled for on Safe account
     */
    function getEnabledGuard(address safe) external view returns (address guardAddress) {
        guardAddress = enabledGuard[safe];
    }

    /**
     * @notice Sets guard on an account. If Zero address is set, mediator will not perform pre and post checks for on Safe transaction.
     * @param guard Address of the guard to be enabled for msg.sender.
     */
    function setGuard(address guard) external {
        if (guard != address(0) && !ISafeProtocolGuard(guard).supportsInterface(type(ISafeProtocolGuard).interfaceId)) {
            revert AddressDoesNotImplementGuardInterface(guard);
        }
        enabledGuard[msg.sender] = guard;
        emit GuardEnabled(msg.sender, guard);
    }
}
