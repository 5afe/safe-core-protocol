// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolManager} from "../interfaces/Manager.sol";
import {ISafeProtocolRegistry} from "../interfaces/Registry.sol";

import {RegistryManager} from "./RegistryManager.sol";

/**
 * @title BaseManager
 * @notice This base contract inherits RegistryManager.
 * @dev This contract is inherited by other manager contracts and is meant for holding commonly used function, modifier, and errors, etc.
 */
abstract contract BaseManager is RegistryManager {

}
