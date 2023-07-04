// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ISafeProtocolRegistry} from "../interfaces/Registry.sol";

contract RegistryManager is Ownable2Step {
    address public registry;

    event RegistryChanged(address oldRegistry, address newRegistry);

    error ModuleNotPermitted(address module, uint64 listedAt, uint64 flaggedAt);

    modifier onlyPermittedModule(address module) {
        // Only allow registered and non-flagged modules
        (uint64 listedAt, uint64 flaggedAt) = ISafeProtocolRegistry(registry).check(module);
        if (listedAt == 0 || flaggedAt != 0) {
            revert ModuleNotPermitted(module, listedAt, flaggedAt);
        }
        _;
    }

    constructor(address _registry, address intitalOwner) {
        _transferOwnership(intitalOwner);
        registry = _registry;
    }

    /**
     * @notice Allows only owner to update the address of a registry. Emits event RegistryChanged(egistry, newRegistry)
     * @param newRegistry Address of new registry
     */
    function setRegistry(address newRegistry) external onlyOwner {
        emit RegistryChanged(registry, newRegistry);
        registry = newRegistry;
    }
}
