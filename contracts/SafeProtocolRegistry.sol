// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;
import "./interfaces/ISafeProtocolRegistry.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract SafeProtocolRegistry is ISafeProtocolRegistry, Ownable2Step {
    mapping(address => ComponentInfo) listedComponents;

    struct ComponentInfo {
        uint256 listedAt;
        uint256 flaggedAt;
    }

    error CannotFlagComponent(address component);
    error CannotAddComponent(address component);

    constructor() {
        // TODO: Set owner in constructor
    }

    function check(address component) external view returns (uint256 listedAt, uint256 flaggedAt) {
        ComponentInfo memory componentInfo = listedComponents[component];
        listedAt = componentInfo.listedAt;
        flaggedAt = componentInfo.flaggedAt;
    }

    function addComponent(address component) external onlyOwner {
        ComponentInfo memory componentInfo = listedComponents[component];

        if (componentInfo.listedAt != 0) {
            revert CannotAddComponent(component);
        }
        listedComponents[component] = ComponentInfo(block.timestamp, 0);
    }

    function flagComponent(address component) external onlyOwner {
        ComponentInfo memory componentInfo = listedComponents[component];

        if (componentInfo.listedAt == 0 || componentInfo.flaggedAt != 0) {
            revert CannotFlagComponent(component);
        }
        // TODO: Find a better way to do this
        listedComponents[component] = ComponentInfo(componentInfo.listedAt, componentInfo.flaggedAt);
    }
}
