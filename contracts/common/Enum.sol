// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

abstract contract Enum {
    enum IntegrationType {
        Plugin,
        Hooks,
        FunctionHandler
    }

    /**
     * @title Enum - Collection of enums used in Safe contracts.
     * @dev Source: https://github.com/safe-global/safe-contracts/blob/7d767973bd21e2d621a4895fdaf9524132efc2f9/contracts/common/Enum.sol#L8
     */
    enum Operation {
        Call,
        DelegateCall
    }
}
