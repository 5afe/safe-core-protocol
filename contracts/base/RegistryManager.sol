// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ISafeProtocolRegistry} from "../interfaces/Registry.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract RegistryManager is Ownable2Step {
    address public registry;

    event RegistryChanged(address indexed oldRegistry, address indexed newRegistry);

    error IntegrationNotPermitted(address plugin, uint64 listedAt, uint64 flaggedAt);
    error AccountDoesNotImplementValidInterfaceId(address account);

    modifier onlyPermittedIntegration(address integration) {
        checkPermittedIntegration(integration);
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
     * @notice Checks if given integration address is listed and not flagged in the registry.
     *         Reverts if given address is not-listed or flagged.
     * @param integration Address of the integration
     */
    function checkPermittedIntegration(address integration) internal view {
        // Only allow registered and non-flagged integrations
        (uint64 listedAt, uint64 flaggedAt) = ISafeProtocolRegistry(registry).check(integration);
        if (listedAt == 0 || flaggedAt != 0) {
            revert IntegrationNotPermitted(integration, listedAt, flaggedAt);
        }
    }

    /**
     * @notice Allows only owner to update the address of a registry. Emits event RegistryChanged(egistry, newRegistry)
     * @dev Do not set owner as a Safe address with Manager enabled as fallback handler.
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
