// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolRegistry} from "./interfaces/Registry.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Enum} from "./common/Enum.sol";
import {ISafeProtocolFunctionHandler, ISafeProtocolHooks, ISafeProtocolPlugin} from "./interfaces/Integrations.sol";

contract SafeProtocolRegistry is ISafeProtocolRegistry, Ownable2Step {
    mapping(address => IntegrationInfo) public listedIntegrations;

    struct IntegrationInfo {
        uint64 listedAt;
        uint64 flaggedAt;
        Enum.IntegrationType integrationType;
    }

    error CannotFlagIntegration(address integration);
    error CannotAddIntegration(address integration);
    error IntegrationDoesNotSupportExpectedInterfaceId(address integration, bytes4 expectedInterfaceId);

    event IntegrationAdded(address indexed integration);
    event IntegrationFlagged(address indexed integration);

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
     *         This function does not permit adding a integration twice. This function validates if integration supports expected interfaceId.
     * @param integration Address of the integration
     * @param integrationType Enum.IntegrationType indicating the type of integration
     */
    function addIntegration(address integration, Enum.IntegrationType integrationType) external virtual onlyOwner {
        IntegrationInfo memory integrationInfo = listedIntegrations[integration];

        if (integrationInfo.listedAt != 0) {
            revert CannotAddIntegration(integration);
        }

        // Check if integration supports expected interface
        if (
            integrationType == Enum.IntegrationType.Hooks && !IERC165(integration).supportsInterface(type(ISafeProtocolHooks).interfaceId)
        ) {
            revert IntegrationDoesNotSupportExpectedInterfaceId(integration, type(ISafeProtocolHooks).interfaceId);
        } else if (
            integrationType == Enum.IntegrationType.Plugin && !IERC165(integration).supportsInterface(type(ISafeProtocolPlugin).interfaceId)
        ) {
            revert IntegrationDoesNotSupportExpectedInterfaceId(integration, type(ISafeProtocolPlugin).interfaceId);
        } else if (
            integrationType == Enum.IntegrationType.FunctionHandler &&
            !IERC165(integration).supportsInterface(type(ISafeProtocolFunctionHandler).interfaceId)
        ) {
            revert IntegrationDoesNotSupportExpectedInterfaceId(integration, type(ISafeProtocolFunctionHandler).interfaceId);
        }

        listedIntegrations[integration] = IntegrationInfo(uint64(block.timestamp), 0, integrationType);
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

        listedIntegrations[integration] = IntegrationInfo(
            integrationInfo.listedAt,
            uint64(block.timestamp),
            integrationInfo.integrationType
        );
        emit IntegrationFlagged(integration);
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(ISafeProtocolRegistry).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
