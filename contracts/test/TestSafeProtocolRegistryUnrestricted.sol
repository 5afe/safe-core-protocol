// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Enum} from "../common/Enum.sol";

import {SafeProtocolRegistry} from "../SafeProtocolRegistry.sol";
import {ISafeProtocolFunctionHandler, ISafeProtocolHooks, ISafeProtocolPlugin} from "../interfaces/Integrations.sol";

/**
 * @title This is a test version of SafeProtocolRegistry that does not restrict any account from adding Integrations.
 *        This contract is only for testing purposes and not meant for production use.
 *        The onlyOwner function modifier of `addIntegration(address,Enum.IntegrationType)` has been removed to allow
 *        developers to add any Integration to the resgistry.
 */
contract TestSafeProtocolRegistryUnrestricted is SafeProtocolRegistry {
    constructor(address initialOwner) SafeProtocolRegistry(initialOwner) {}

    /**
     * @notice Allows any account to add a integration. A integration can be any address including zero address for now.
     *         This function does not permit adding a integration twice. This function validates if integration supports expected interfaceId.
     * @param integration Address of the integration
     * @param integrationType Enum.IntegrationType indicating the type of integration
     */
    function addIntegration(address integration, Enum.IntegrationType integrationType) external override {
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
}
