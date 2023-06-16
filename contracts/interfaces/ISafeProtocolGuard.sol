// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;
import "../external/interfaces/ISafe.sol";
import "./ISafeRootAccess.sol";
import "../libraries/DataTypes.sol";

interface ISafeProtocolGuard {
    function preCheck(
        ISafe safe,
        DataTypes.SafeTransaction calldata tx,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    function preCheckRootAccess(
        ISafe safe,
        DataTypes.SafeRootAccess calldata rootAccess,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData);

    function postCheck(ISafe safe, bool success, bytes calldata preCheckData) external;
}
