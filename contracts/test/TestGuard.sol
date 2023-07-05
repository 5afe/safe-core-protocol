// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocolGuard} from "../interfaces/Components.sol";
import {ISafe} from "../interfaces/Accounts.sol";
import {SafeTransaction, SafeRootAccess} from "../DataTypes.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract TestGuard is ISafeProtocolGuard {
    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return
            interfaceId == type(ISafeProtocolGuard).interfaceId || // 0x907e1c56
            interfaceId == type(IERC165).interfaceId; // 0x01ffc9a7
    }

    function preCheck(
        ISafe safe,
        SafeTransaction calldata tx,
        uint256 executionType,
        bytes calldata executionMeta
    ) external override returns (bytes memory preCheckData) {}

    function preCheckRootAccess(
        ISafe safe,
        SafeRootAccess calldata rootAccess,
        uint256 executionType,
        bytes calldata executionMeta
    ) external override returns (bytes memory preCheckData) {}

    function postCheck(ISafe safe, bool success, bytes calldata preCheckData) external override {}
}

contract TestContractNotImplementingGuardInterface is IERC165 {
    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}
