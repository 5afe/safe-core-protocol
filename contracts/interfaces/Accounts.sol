// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

/**
 * @title ISafe Declares the functions that are called on a Safe by Safe protocol.
 */
interface ISafe {
    function execTransactionFromPlugin(
        address payable to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success);

    function execTransactionFromPluginReturnData(
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation
    ) external returns (bool success, bytes memory returnData);
}
