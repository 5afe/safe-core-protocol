// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolManager} from "../interfaces/Manager.sol";
import {ISafeProtocolRegistry} from "../interfaces/Registry.sol";

import {RegistryManager} from "./RegistryManager.sol";

/**
 * @title This base contract inherits RegistryManager.
 */
abstract contract BaseManager is RegistryManager {

}
