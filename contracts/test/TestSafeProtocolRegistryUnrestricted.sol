// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Enum} from "../common/Enum.sol";

import {SafeProtocolRegistry} from "../SafeProtocolRegistry.sol";
import {ISafeProtocolFunctionHandler, ISafeProtocolHooks, ISafeProtocolPlugin} from "../interfaces/Modules.sol";

/**
 * @title This is a test version of SafeProtocolRegistry that does not restrict any account from adding Modules.
 *        This contract is only for testing purposes and not meant for production use.
 *        The onlyOwner function modifier of `addModule(address,Enum.ModuleType)` has been removed to allow
 *        developers to add any Module to the resgistry.
 */
contract TestSafeProtocolRegistryUnrestricted is SafeProtocolRegistry {
    constructor(address initialOwner) SafeProtocolRegistry(initialOwner) {}

    /**
     * @notice Allows any account to add a module. A module can be any address including zero address for now.
     *         This function does not permit adding a module twice. This function validates if module supports expected interfaceId.
     * @param module Address of the module
     * @param moduleType Enum.ModuleType indicating the type of module
     */
    function addModule(address module, uint8 moduleType) external override {
        _addModule(module, moduleType);
    }
}
