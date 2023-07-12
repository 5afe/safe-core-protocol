// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

abstract contract Enum {
    enum IntegrationType {
        Plugin,
        Hooks,
        FunctionHandler
    }
}
