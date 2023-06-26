// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

contract TestDelegateCallReceiver {
    address immutable ethReceiver;

    constructor(address _ethReceiver) {
        ethReceiver = _ethReceiver;
    }

    receive() external payable {
        (bool success, bytes memory data) = ethReceiver.call{value: address(this).balance}("");
        if (!success) {
            revert("Failed to send eth");
        }
    }
}
