// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

interface ISafeProtocolRegistry {
    /// @param component Address of the component that should be checked 
    /// @return listedAt MUST return the block number when the component was listed in the registry (or 0 if not listed)  
    /// @return flaggedAt MUST return the block number when the component was listed in the flagged as faulty (or 0 if not flagged)  
    function check(address component) external view returns (uint256 listedAt, uint256 flaggedAt);
}