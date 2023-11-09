export const PLUGIN_PERMISSION_NONE: number = 0;
export const PLUGIN_PERMISSION_EXECUTE_CALL: number = 1;
export const PLUGIN_PERMISSION_CALL_TO_SELF: number = 2;
export const PLUGIN_PERMISSION_DELEGATE_CALL: number = 4;

// Module types
export const MODULE_TYPE_PLUGIN: number = 1;
export const MODULE_TYPE_FUNCTION_HANDLER: number = 2;
export const MODULE_TYPE_HOOKS: number = 4;
export const MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS: number = 8;
export const MODULE_TYPE_SIGNATURE_VALIDATOR: number = 16;

// solidity: bytes4(keccak256("Account712Signature(bytes32,bytes32,bytes)"));
// javascript: hre.ethers.keccak256(toUtf8Bytes("Account712Signature(bytes32,bytes32,bytes)")).slice(0, 10);
export const SIGNATURE_VALIDATOR_SELECTOR =  "0xb5c726cb";
