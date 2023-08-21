// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

abstract contract OnlySelfCallable {
    error InvalidSender(address sender);
    error InvalidCalldataLength();

    modifier onlySelf() {
        checkCallerisSender();
        _;
    }

    function checkCallerisSender() private view {
        if (msg.data.length < 20) {
            revert InvalidCalldataLength();
        }
        address sender;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            sender := shr(96, calldataload(sub(calldatasize(), 20)))
        }
        if (sender != msg.sender) {
            revert InvalidSender(sender);
        }
    }
}
