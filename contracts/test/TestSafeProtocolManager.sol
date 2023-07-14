// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {SafeProtocolManager} from "../SafeProtocolManager.sol";

/**
 * @title This is a test version of SafeProtocolManager and should use TestSafeProtocolRegistryUnrestricted contract as resgistry.
 */
contract TestSafeProtocolManager is SafeProtocolManager {
    constructor(address initialOwner, address registry) SafeProtocolManager(initialOwner, registry) {}
}
