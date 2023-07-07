// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolRegistry} from "./interfaces/Registry.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract SafeProtocolRegistry is ISafeProtocolRegistry, Ownable2Step {
    mapping(address => IntegrationInfo) public listedIntegrations;

    struct IntegrationInfo {
        uint64 listedAt;
        uint64 flaggedAt;
    }

    error CannotFlagIntegration(address integration);
    error CannotAddIntegration(address integration);

    event IntegrationAdded(address integration);
    event IntegrationFlagged(address integration);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    /**
     * @notice This function returns information about a integration
     * @param integration Address of the integration to be checked
     * @return listedAt Timestamp of listing the integration. This value will be 0 if not listed.
     * @return flaggedAt Timestamp of falgging the integration. This value will be 0 if not flagged.
     */
    function check(address integration) external view returns (uint64 listedAt, uint64 flaggedAt) {
        IntegrationInfo memory integrationInfo = listedIntegrations[integration];
        listedAt = integrationInfo.listedAt;
        flaggedAt = integrationInfo.flaggedAt;
    }

    /**
     * @notice Allows only owner to add a integration. A integration can be any address including zero address for now.
     *         This function does not permit adding a integration twice.
     *         TODO: Add logic to validate if integration implements correct interface.
     * @param integration Address of the integration
     */
    function addIntegration(address integration) external onlyOwner {
        IntegrationInfo memory integrationInfo = listedIntegrations[integration];

        if (integrationInfo.listedAt != 0) {
            revert CannotAddIntegration(integration);
        }
        listedIntegrations[integration] = IntegrationInfo(uint64(block.timestamp), 0);
        emit IntegrationAdded(integration);
    }

    /**
     * @notice Allows only owner to flad a integration. Only previously added integration can be flagged.
     *         This function does not permit flagging a integration twice.
     *         A integration can be any address including zero address for now.
     * @param integration Address of the integration
     */
    function flagIntegration(address integration) external onlyOwner {
        IntegrationInfo memory integrationInfo = listedIntegrations[integration];

        if (integrationInfo.listedAt == 0 || integrationInfo.flaggedAt != 0) {
            revert CannotFlagIntegration(integration);
        }

        listedIntegrations[integration] = IntegrationInfo(integrationInfo.listedAt, uint64(block.timestamp));
        emit IntegrationFlagged(integration);
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(ISafeProtocolRegistry).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
