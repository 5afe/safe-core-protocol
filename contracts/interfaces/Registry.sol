// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface ISafeProtocolRegistry is IERC165 {
    /// @param integration Address of the integration that should be checked
    /// @return listedAt MUST return the block number when the integration was listed in the registry (or 0 if not listed)
    /// @return flaggedAt MUST return the block number when the integration was listed in the flagged as faulty (or 0 if not flagged)
    function check(address integration) external view returns (uint64 listedAt, uint64 flaggedAt);
}
