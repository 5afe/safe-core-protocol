// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

contract TestFallbackReceiver {
    address public immutable ethReceiver;

    constructor(address _ethReceiver) {
        ethReceiver = _ethReceiver;
    }

    receive() external payable {
        // solhint-disable-next-line no-unused-vars
        (bool success, bytes memory data) = ethReceiver.call{value: address(this).balance}("");
        if (!success) {
            revert("Failed to send eth");
        }
    }
}

contract TestFallbackReceiverReverter {
    receive() external payable {
        revert();
    }
}
