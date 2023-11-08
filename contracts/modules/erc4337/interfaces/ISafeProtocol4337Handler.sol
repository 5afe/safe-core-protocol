// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {IAccount} from "./IERC4337.sol";

interface ISafeProtocol4337Handler is IAccount {
    function executeUserOp(address to, uint256 value, bytes calldata data) external;
}
