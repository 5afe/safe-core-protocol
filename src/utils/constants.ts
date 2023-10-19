export const PLUGIN_PERMISSION_NONE = 0n;
export const PLUGIN_PERMISSION_EXECUTE_CALL = 1n;
export const PLUGIN_PERMISSION_CALL_TO_SELF = 2n;
export const PLUGIN_PERMISSION_DELEGATE_CALL = 4n;

// Module types
export const MODULE_TYPE_PLUGIN = 1n;
export const MODULE_TYPE_FUNCTION_HANDLER = 2n;
export const MODULE_TYPE_HOOKS = 4n;
export const MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS = 8n;
export const MODULE_TYPE_SIGNATURE_VALIDATOR = 16n;

// solidity: bytes4(keccak256("Account712Signature(bytes32,bytes32,bytes)"));
// javascript: hre.ethers.keccak256(toUtf8Bytes("Account712Signature(bytes32,bytes32,bytes)")).slice(0, 10);
export const SIGNATURE_VALIDATOR_SELECTOR =  "0xb5c726cb"; 
