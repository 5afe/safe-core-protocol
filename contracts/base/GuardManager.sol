// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

contract GuardManager {
    mapping(address => address) public enabledGuard;

    // Events
    event GuardEnabled(address indexed safe, address indexed guardAddress);
    event GuardDisabled(address indexed safe, address indexed guardAddress);

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
     * @notice Enables guard on an account.
     * @param guard Address of the guard to be enabled for msg.sender.
     */
    function enableGuard(address guard) external {
        enabledGuard[msg.sender] = guard;
        emit GuardEnabled(msg.sender, guard);
    }

    /**
     * @notice Disables guard on an account.
     */
    function disableGuard() external {
        // Evaluate if caching variable saves some gas.
        emit GuardDisabled(msg.sender, enabledGuard[msg.sender]);
        enabledGuard[msg.sender] = address(0);
    }
}
