// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;
import "../external/interfaces/ISafe.sol";
interface ISafeProtocolFallbackMethod {
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external returns (bytes memory result);
}

interface ISafeProtocolStaticFallbackMethod {
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external view returns (bytes memory result);
}