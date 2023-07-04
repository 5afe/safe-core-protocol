// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract RegistryManager is Ownable2Step {
    address public registry;
    event RegistryChanged(address oldRegistry, address newRegistry);

    constructor(address _registry) {
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
