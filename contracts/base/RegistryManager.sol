// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ISafeProtocolRegistry} from "../interfaces/Registry.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract RegistryManager is Ownable2Step {
    address public registry;

    event RegistryChanged(address indexed oldRegistry, address indexed newRegistry);

    error ModuleNotPermitted(address plugin, uint64 listedAt, uint64 flaggedAt);
    error ContractDoesNotImplementValidInterfaceId(address account);

    modifier onlyPermittedModule(address module) {
        checkPermittedModule(module);
        _;
    }

    /*
     * @notice Constructor that sets registry address and owner address.
     * @dev Do not set owner as a Safe address with Manager enabled as fallback handler.
     *      If owner is a Safe with Manager enabled as fallback handler, then a malicious
     *      address can call Safe with calldata that updates registry which gets forwarded to Manager.
     * @param intitalOwner Address of the owner for this contract.
     * @param _registry address of the account implementing ISafeProtocolRegistry interface.
     */
    constructor(address _registry, address intitalOwner) {
        _transferOwnership(intitalOwner);
        if (!IERC165(_registry).supportsInterface(type(ISafeProtocolRegistry).interfaceId)) {
            revert ContractDoesNotImplementValidInterfaceId(_registry);
        }
        registry = _registry;
    }

    /**
     * @notice Checks if given module address is listed and not flagged in the registry.
     *         Reverts if given address is not-listed or flagged.
     * @param module Address of the module
     */
    function checkPermittedModule(address module) internal view {
        // Only allow registered and non-flagged modules
        (uint64 listedAt, uint64 flaggedAt) = ISafeProtocolRegistry(registry).check(module);
        if (listedAt == 0 || flaggedAt != 0) {
            revert ModuleNotPermitted(module, listedAt, flaggedAt);
        }
    }

    /**
     * @notice Allows only owner to update the address of a registry. Emits event RegistryChanged(egistry, newRegistry)
     * @param newRegistry Address of new registry
     */
    function setRegistry(address newRegistry) external onlyOwner {
        if (!IERC165(newRegistry).supportsInterface(type(ISafeProtocolRegistry).interfaceId)) {
            revert ContractDoesNotImplementValidInterfaceId(newRegistry);
        }
        emit RegistryChanged(registry, newRegistry);
        registry = newRegistry;
    }
}
