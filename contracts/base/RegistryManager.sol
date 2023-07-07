// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ISafeProtocolRegistry} from "../interfaces/Registry.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract RegistryManager is Ownable2Step {
    address public registry;

    event RegistryChanged(address indexed oldRegistry, address indexed newRegistry);

    error PluginNotPermitted(address plugin, uint64 listedAt, uint64 flaggedAt);
    error AccountDoesNotImplementValidInterfaceId(address account);

    modifier onlyPermittedPlugin(address plugin) {
        // Only allow registered and non-flagged plugins
        (uint64 listedAt, uint64 flaggedAt) = ISafeProtocolRegistry(registry).check(plugin);
        if (listedAt == 0 || flaggedAt != 0) {
            revert PluginNotPermitted(plugin, listedAt, flaggedAt);
        }
        _;
    }

    constructor(address _registry, address intitalOwner) {
        _transferOwnership(intitalOwner);
        if (!IERC165(_registry).supportsInterface(type(ISafeProtocolRegistry).interfaceId)) {
            revert AccountDoesNotImplementValidInterfaceId(_registry);
        }
        registry = _registry;
    }

    /**
     * @notice Allows only owner to update the address of a registry. Emits event RegistryChanged(egistry, newRegistry)
     * @param newRegistry Address of new registry
     */
    function setRegistry(address newRegistry) external onlyOwner {
        if (!IERC165(newRegistry).supportsInterface(type(ISafeProtocolRegistry).interfaceId)) {
            revert AccountDoesNotImplementValidInterfaceId(newRegistry);
        }
        emit RegistryChanged(registry, newRegistry);
        registry = newRegistry;
    }
}
