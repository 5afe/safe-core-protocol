// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ISafeProtocolRegistry} from "../interfaces/Registry.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {OnlyAccountCallable} from "./OnlyAccountCallable.sol";

contract RegistryManager is Ownable2Step, OnlyAccountCallable {
    address public registry;

    event RegistryChanged(address indexed oldRegistry, address indexed newRegistry);

    error ModuleNotPermitted(address plugin, uint64 listedAt, uint64 flaggedAt, uint8 moduleType);
    error ContractDoesNotImplementValidInterfaceId(address account);

    modifier onlyPermittedModule(address module, uint8 moduleType) {
        checkPermittedModule(module, moduleType);
        _;
    }

    /*
     * @notice Constructor that sets registry address and owner address.
     * @param initialOwner Address of the owner for this contract.
     *        Owner is expected to be an account that appends 20 bytes of caller (i.e. self) address to the calldata when calling setRegistry(address) function.
     * @param _registry address of the account implementing ISafeProtocolRegistry interface.
     */
    constructor(address _registry, address initialOwner) {
        _transferOwnership(initialOwner);
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
    function checkPermittedModule(address module, uint8 moduleType) internal view {
        // Only allow registered and non-flagged modules
        (uint64 listedAt, uint64 flaggedAt) = ISafeProtocolRegistry(registry).check(module, bytes32(uint256(moduleType)));
        if (listedAt == 0 || flaggedAt != 0) {
            revert ModuleNotPermitted(module, listedAt, flaggedAt, moduleType);
        }
    }

    /**
     * @notice Allows only owner to update the address of a registry. Emits event RegistryChanged(egistry, newRegistry)
     * @param newRegistry Address of new registry
     */
    function setRegistry(address newRegistry) external onlyOwner onlyAccount {
        if (!IERC165(newRegistry).supportsInterface(type(ISafeProtocolRegistry).interfaceId)) {
            revert ContractDoesNotImplementValidInterfaceId(newRegistry);
        }
        emit RegistryChanged(registry, newRegistry);
        registry = newRegistry;
    }
}
