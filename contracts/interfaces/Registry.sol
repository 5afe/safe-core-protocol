// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface ISafeProtocolRegistry is IERC165 {
    /** @param module Address of the module that should be checked
     * @return listedAt MUST return the block number when the module was listed in the registry (or 0 if not listed)
     * @return flaggedAt MUST return the block number when the module was listed in the flagged as faulty (or 0 if not flagged)
     * @return moduleTypes uint8 indicating the types of module that the contract can be used as in the protocol.
     *                     The value is a bitwise OR of the module types. For example, if the module can be used as a plugin and
     *                     a function handler, the value will be 2^0 (Plugin) + 2^1 (Function Handler) = 3.
     */
    function check(address module) external view returns (uint64 listedAt, uint64 flaggedAt, uint8 moduleTypes);
}
