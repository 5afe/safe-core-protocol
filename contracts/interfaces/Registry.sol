// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface ISafeProtocolRegistry is IERC165 {
    /**
     * @notice This function allows external contracts to check if a module is listed and not flagged as faulty in the registry.
     * @param module Address of the module that should be checked
     * @param data bytes32 providing more information about the module. The type of this parameter is bytes32 to provide the flexibility to the developers to interpret the value in the registry. For example, it can be moduleType and registry would then check if given address can be used as that type of module.
     * @return listedAt MUST return the block number when the module was listed in the registry (or 0 if not listed)
     * @return flaggedAt MUST return the block number when the module was listed in the flagged as faulty (or 0 if not flagged)
     */
    function check(address module, bytes32 data) external view returns (uint64 listedAt, uint64 flaggedAt);
}
