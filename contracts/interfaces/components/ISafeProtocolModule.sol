// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

interface ISafeProtocolModule {
    function name() external view returns (string memory name);

    function version() external view returns (string memory version);

    function metaProvider() external view returns (uint256 providerType, bytes memory location);

    function requiresRootAccess() external view returns (bool requiresRootAccess);
}
