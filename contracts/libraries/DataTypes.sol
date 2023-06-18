// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

/**
 * @title DataTypes - A library that specifies the new types used in the Safe Protocol in the form of structs
 * @dev All the structs will be initially definied in this library and later moved to appropriate contract based on individual use case
 */
library DataTypes {
    struct SafeProtocolAction {
        address to;
        uint256 value;
        bytes data;
    }

    struct SafeTransaction {
        SafeProtocolAction[] actions;
        uint256 nonce;
        bytes32 metaHash;
    }

    struct SafeRootAccess {
        SafeProtocolAction action;
        uint256 nonce;
        bytes32 metaHash;
    }
}
