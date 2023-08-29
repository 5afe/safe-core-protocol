// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolRegistry} from "./interfaces/Registry.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Enum} from "./common/Enum.sol";
import {ISafeProtocolFunctionHandler, ISafeProtocolHooks, ISafeProtocolPlugin} from "./interfaces/Modules.sol";

contract SafeProtocolRegistry is ISafeProtocolRegistry, Ownable2Step {
    mapping(address => ModuleInfo) public listedModules;

    struct ModuleInfo {
        uint64 listedAt;
        uint64 flaggedAt;
        Enum.ModuleType moduleType;
    }

    error CannotFlagModule(address module);
    error CannotAddModule(address module);
    error ModuleDoesNotSupportExpectedInterfaceId(address module, bytes4 expectedInterfaceId);

    event ModuleAdded(address indexed module);
    event ModuleFlagged(address indexed module);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    /**
     * @notice This function returns information about a module
     * @param module Address of the module to be checked
     * @return listedAt Timestamp of listing the module. This value will be 0 if not listed.
     * @return flaggedAt Timestamp of falgging the module. This value will be 0 if not flagged.
     */
    function check(address module) external view returns (uint64 listedAt, uint64 flaggedAt) {
        ModuleInfo memory moduleInfo = listedModules[module];
        listedAt = moduleInfo.listedAt;
        flaggedAt = moduleInfo.flaggedAt;
    }

    /**
     * @notice Allows only owner to add a module. A module can be any address including zero address for now.
     *         This function does not permit adding a module twice. This function validates if module supports expected interfaceId.
     * @param module Address of the module
     * @param moduleType Enum.ModuleType indicating the type of module
     */
    function addModule(address module, Enum.ModuleType moduleType) external virtual onlyOwner {
        ModuleInfo memory moduleInfo = listedModules[module];

        if (moduleInfo.listedAt != 0) {
            revert CannotAddModule(module);
        }

        // Check if module supports expected interface
        if (moduleType == Enum.ModuleType.Hooks && !IERC165(module).supportsInterface(type(ISafeProtocolHooks).interfaceId)) {
            revert ModuleDoesNotSupportExpectedInterfaceId(module, type(ISafeProtocolHooks).interfaceId);
        } else if (moduleType == Enum.ModuleType.Plugin && !IERC165(module).supportsInterface(type(ISafeProtocolPlugin).interfaceId)) {
            revert ModuleDoesNotSupportExpectedInterfaceId(module, type(ISafeProtocolPlugin).interfaceId);
        } else if (
            moduleType == Enum.ModuleType.FunctionHandler &&
            !IERC165(module).supportsInterface(type(ISafeProtocolFunctionHandler).interfaceId)
        ) {
            revert ModuleDoesNotSupportExpectedInterfaceId(module, type(ISafeProtocolFunctionHandler).interfaceId);
        }

        listedModules[module] = ModuleInfo(uint64(block.timestamp), 0, moduleType);
        emit ModuleAdded(module);
    }

    /**
     * @notice Allows only owner to flad a module. Only previously added module can be flagged.
     *         This function does not permit flagging a module twice.
     *         A module can be any address including zero address for now.
     * @param module Address of the module
     */
    function flagModule(address module) external onlyOwner {
        ModuleInfo memory moduleInfo = listedModules[module];

        if (moduleInfo.listedAt == 0 || moduleInfo.flaggedAt != 0) {
            revert CannotFlagModule(module);
        }

        listedModules[module] = ModuleInfo(moduleInfo.listedAt, uint64(block.timestamp), moduleInfo.moduleType);
        emit ModuleFlagged(module);
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(ISafeProtocolRegistry).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
