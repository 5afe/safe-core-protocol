// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;
import {ISafeProtocolRegistry} from "./interfaces/ISafeProtocolRegistry.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract SafeProtocolRegistry is ISafeProtocolRegistry, Ownable2Step {
    /**
     * @dev TODO: Determint whether there exists a more gas efficient way to store component info based on the way component information is accessed.
     *      For simplicity, currently using a struct.
     */
    mapping(address => ComponentInfo) public listedComponents;

    struct ComponentInfo {
        uint64 listedAt;
        uint64 flaggedAt;
    }

    error CannotFlagComponent(address component);
    error CannotAddComponent(address component);

    event ComponentAdded(address component);
    event ComponentFlagged(address component);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    /**
     * @notice This function returns information about a component
     * @param component Address of the component to be checked
     * @return listedAt Timestamp of listing the component. This value will be 0 if not listed.
     * @return flaggedAt Timestamp of falgging the component. This value will be 0 if not flagged.
     */
    function check(address component) external view returns (uint64 listedAt, uint64 flaggedAt) {
        ComponentInfo memory componentInfo = listedComponents[component];
        listedAt = componentInfo.listedAt;
        flaggedAt = componentInfo.flaggedAt;
    }

    /**
     * @notice Allows only owner to add a component. A component can be any address including zero address for now.
     *         This function does not permit adding a component twice.
     *         TODO: Add logic to validate if component implements correct interface.
     * @param component Address of the component
     */
    function addComponent(address component) external onlyOwner {
        ComponentInfo memory componentInfo = listedComponents[component];

        if (componentInfo.listedAt != 0) {
            revert CannotAddComponent(component);
        }
        listedComponents[component] = ComponentInfo(uint64(block.timestamp), 0);
        emit ComponentAdded(component);
    }

    /**
     * @notice Allows only owner to flad a component. Only previously added component can be flagged.
     *         This function does not permit flagging a component twice.
     *         A component can be any address including zero address for now.
     * @param component Address of the component
     */
    function flagComponent(address component) external onlyOwner {
        ComponentInfo memory componentInfo = listedComponents[component];

        if (componentInfo.listedAt == 0 || componentInfo.flaggedAt != 0) {
            revert CannotFlagComponent(component);
        }
        // TODO: Determint whether there exists a more gas efficient way to update component info.
        listedComponents[component] = ComponentInfo(componentInfo.listedAt, uint64(block.timestamp));
        emit ComponentFlagged(component);
    }
}
