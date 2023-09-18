// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

// Plugin permissions
uint8 constant PLUGIN_PERMISSION_NONE = 0;
uint8 constant PLUGIN_PERMISSION_EXECUTE_CALL = 1;
uint8 constant PLUGIN_PERMISSION_CALL_TO_SELF = 2;
uint8 constant PLUGIN_PERMISSION_EXECUTE_DELEGATECALL = 4;
