// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

/**
 * @title ISafe Declares the functions that are called on a Safe by Safe protocol.
 */
interface ISafe {
    
    function setModule(address _module) external;

    function execTransactionFromModule(
        address payable to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success);
}
