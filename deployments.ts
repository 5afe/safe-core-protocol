export default {
  "5": [
    {
      "name": "goerli",
      "chainId": "5",
      "contracts": {
        "SafeProtocolManager": {
          "address": "0xAD7F6221609ff23Db8a1692A9A9534d48856D791",
          "abi": [
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "initialOwner",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "_registry",
                  "type": "address"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "account",
                  "type": "address"
                }
              ],
              "name": "AccountDoesNotImplementValidInterfaceId",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                },
                {
                  "internalType": "uint256",
                  "name": "index",
                  "type": "uint256"
                }
              ],
              "name": "ActionExecutionFailed",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "functionSelector",
                  "type": "bytes4"
                }
              ],
              "name": "FunctionHandlerNotSet",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "internalType": "uint64",
                  "name": "listedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "uint64",
                  "name": "flaggedAt",
                  "type": "uint64"
                }
              ],
              "name": "IntegrationNotPermitted",
              "type": "error"
            },
            {
              "inputs": [],
              "name": "InvalidCalldataLength",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "InvalidPluginAddress",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "InvalidPrevPluginAddress",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "sender",
                  "type": "address"
                }
              ],
              "name": "InvalidSender",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                },
                {
                  "internalType": "uint256",
                  "name": "index",
                  "type": "uint256"
                }
              ],
              "name": "InvalidToFieldInSafeProtocolAction",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "internalType": "bool",
                  "name": "requiresRootAccess",
                  "type": "bool"
                },
                {
                  "internalType": "bool",
                  "name": "providedValue",
                  "type": "bool"
                }
              ],
              "name": "PluginAccessMismatch",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginAlreadyEnabled",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginEnabledOnlyForRootAccess",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginNotEnabled",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "sender",
                  "type": "address"
                }
              ],
              "name": "PluginRequiresRootAccess",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                }
              ],
              "name": "RootAccessActionExecutionFailed",
              "type": "error"
            },
            {
              "inputs": [],
              "name": "ZeroPageSizeNotAllowed",
              "type": "error"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "nonce",
                  "type": "uint256"
                }
              ],
              "name": "ActionsExecuted",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "bytes4",
                  "name": "selector",
                  "type": "bytes4"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "functionHandler",
                  "type": "address"
                }
              ],
              "name": "FunctionHandlerChanged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "hooksAddress",
                  "type": "address"
                }
              ],
              "name": "HooksChanged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferStarted",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferred",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginDisabled",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "bool",
                  "name": "allowRootAccess",
                  "type": "bool"
                }
              ],
              "name": "PluginEnabled",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "oldRegistry",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newRegistry",
                  "type": "address"
                }
              ],
              "name": "RegistryChanged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                }
              ],
              "name": "RootAccessActionExecuted",
              "type": "event"
            },
            {
              "stateMutability": "nonpayable",
              "type": "fallback"
            },
            {
              "inputs": [],
              "name": "acceptOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes32",
                  "name": "",
                  "type": "bytes32"
                },
                {
                  "internalType": "bool",
                  "name": "success",
                  "type": "bool"
                }
              ],
              "name": "checkAfterExecution",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "value",
                  "type": "uint256"
                },
                {
                  "internalType": "bytes",
                  "name": "data",
                  "type": "bytes"
                },
                {
                  "internalType": "enum Enum.Operation",
                  "name": "operation",
                  "type": "uint8"
                },
                {
                  "internalType": "address",
                  "name": "module",
                  "type": "address"
                }
              ],
              "name": "checkModuleTransaction",
              "outputs": [
                {
                  "internalType": "bytes32",
                  "name": "moduleTxHash",
                  "type": "bytes32"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "value",
                  "type": "uint256"
                },
                {
                  "internalType": "bytes",
                  "name": "data",
                  "type": "bytes"
                },
                {
                  "internalType": "enum Enum.Operation",
                  "name": "operation",
                  "type": "uint8"
                },
                {
                  "internalType": "uint256",
                  "name": "safeTxGas",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "baseGas",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "gasPrice",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "gasToken",
                  "type": "address"
                },
                {
                  "internalType": "address payable",
                  "name": "refundReceiver",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "signatures",
                  "type": "bytes"
                },
                {
                  "internalType": "address",
                  "name": "msgSender",
                  "type": "address"
                }
              ],
              "name": "checkTransaction",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "prevPlugin",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "disablePlugin",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "internalType": "bool",
                  "name": "allowRootAccess",
                  "type": "bool"
                }
              ],
              "name": "enablePlugin",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "enabledHooks",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "enabledPlugins",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "rootAddressGranted",
                  "type": "bool"
                },
                {
                  "internalType": "address",
                  "name": "nextPluginPointer",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "contract ISafe",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "components": [
                    {
                      "components": [
                        {
                          "internalType": "address payable",
                          "name": "to",
                          "type": "address"
                        },
                        {
                          "internalType": "uint256",
                          "name": "value",
                          "type": "uint256"
                        },
                        {
                          "internalType": "bytes",
                          "name": "data",
                          "type": "bytes"
                        }
                      ],
                      "internalType": "struct SafeProtocolAction",
                      "name": "action",
                      "type": "tuple"
                    },
                    {
                      "internalType": "uint256",
                      "name": "nonce",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes32",
                      "name": "metadataHash",
                      "type": "bytes32"
                    }
                  ],
                  "internalType": "struct SafeRootAccess",
                  "name": "rootAccess",
                  "type": "tuple"
                }
              ],
              "name": "executeRootAccess",
              "outputs": [
                {
                  "internalType": "bytes",
                  "name": "data",
                  "type": "bytes"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "contract ISafe",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "components": [
                    {
                      "components": [
                        {
                          "internalType": "address payable",
                          "name": "to",
                          "type": "address"
                        },
                        {
                          "internalType": "uint256",
                          "name": "value",
                          "type": "uint256"
                        },
                        {
                          "internalType": "bytes",
                          "name": "data",
                          "type": "bytes"
                        }
                      ],
                      "internalType": "struct SafeProtocolAction[]",
                      "name": "actions",
                      "type": "tuple[]"
                    },
                    {
                      "internalType": "uint256",
                      "name": "nonce",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes32",
                      "name": "metadataHash",
                      "type": "bytes32"
                    }
                  ],
                  "internalType": "struct SafeTransaction",
                  "name": "transaction",
                  "type": "tuple"
                }
              ],
              "name": "executeTransaction",
              "outputs": [
                {
                  "internalType": "bytes[]",
                  "name": "data",
                  "type": "bytes[]"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "",
                  "type": "bytes4"
                }
              ],
              "name": "functionHandlers",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                }
              ],
              "name": "getEnabledHooks",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "hooksAddress",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "selector",
                  "type": "bytes4"
                }
              ],
              "name": "getFunctionHandler",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "functionHandler",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "getPluginInfo",
              "outputs": [
                {
                  "components": [
                    {
                      "internalType": "bool",
                      "name": "rootAddressGranted",
                      "type": "bool"
                    },
                    {
                      "internalType": "address",
                      "name": "nextPluginPointer",
                      "type": "address"
                    }
                  ],
                  "internalType": "struct SafeProtocolManager.PluginAccessInfo",
                  "name": "enabled",
                  "type": "tuple"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "start",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "pageSize",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                }
              ],
              "name": "getPluginsPaginated",
              "outputs": [
                {
                  "internalType": "address[]",
                  "name": "array",
                  "type": "address[]"
                },
                {
                  "internalType": "address",
                  "name": "next",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "isPluginEnabled",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "owner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "pendingOwner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "registry",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "renounceOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes4",
                  "name": "selector",
                  "type": "bytes4"
                },
                {
                  "internalType": "address",
                  "name": "functionHandler",
                  "type": "address"
                }
              ],
              "name": "setFunctionHandler",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "hooks",
                  "type": "address"
                }
              ],
              "name": "setHooks",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "newRegistry",
                  "type": "address"
                }
              ],
              "name": "setRegistry",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes4",
                  "name": "interfaceId",
                  "type": "bytes4"
                }
              ],
              "name": "supportsInterface",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "tempHooksData",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "hooksAddress",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "preCheckData",
                  "type": "bytes"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "transferOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ]
        },
        "SafeProtocolRegistry": {
          "address": "0x1C3b21235Dfc2bbEe730aD8F63742aee54EE42f5",
          "abi": [
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "initialOwner",
                  "type": "address"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "CannotAddIntegration",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "CannotFlagIntegration",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "expectedInterfaceId",
                  "type": "bytes4"
                }
              ],
              "name": "IntegrationDoesNotSupportExpectedInterfaceId",
              "type": "error"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "IntegrationAdded",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "IntegrationFlagged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferStarted",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferred",
              "type": "event"
            },
            {
              "inputs": [],
              "name": "acceptOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                },
                {
                  "internalType": "enum Enum.IntegrationType",
                  "name": "integrationType",
                  "type": "uint8"
                }
              ],
              "name": "addIntegration",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "check",
              "outputs": [
                {
                  "internalType": "uint64",
                  "name": "listedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "uint64",
                  "name": "flaggedAt",
                  "type": "uint64"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "flagIntegration",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "listedIntegrations",
              "outputs": [
                {
                  "internalType": "uint64",
                  "name": "listedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "uint64",
                  "name": "flaggedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "enum Enum.IntegrationType",
                  "name": "integrationType",
                  "type": "uint8"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "owner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "pendingOwner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "renounceOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes4",
                  "name": "interfaceId",
                  "type": "bytes4"
                }
              ],
              "name": "supportsInterface",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "transferOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ]
        },
        "TestSafeProtocolManager": {
          "address": "0x87c9199890202EF0ABf219A83F9BF9a00cB5feCb",
          "abi": [
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "initialOwner",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "registry",
                  "type": "address"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "account",
                  "type": "address"
                }
              ],
              "name": "AccountDoesNotImplementValidInterfaceId",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                },
                {
                  "internalType": "uint256",
                  "name": "index",
                  "type": "uint256"
                }
              ],
              "name": "ActionExecutionFailed",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "functionSelector",
                  "type": "bytes4"
                }
              ],
              "name": "FunctionHandlerNotSet",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "internalType": "uint64",
                  "name": "listedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "uint64",
                  "name": "flaggedAt",
                  "type": "uint64"
                }
              ],
              "name": "IntegrationNotPermitted",
              "type": "error"
            },
            {
              "inputs": [],
              "name": "InvalidCalldataLength",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "InvalidPluginAddress",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "InvalidPrevPluginAddress",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "sender",
                  "type": "address"
                }
              ],
              "name": "InvalidSender",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                },
                {
                  "internalType": "uint256",
                  "name": "index",
                  "type": "uint256"
                }
              ],
              "name": "InvalidToFieldInSafeProtocolAction",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "internalType": "bool",
                  "name": "requiresRootAccess",
                  "type": "bool"
                },
                {
                  "internalType": "bool",
                  "name": "providedValue",
                  "type": "bool"
                }
              ],
              "name": "PluginAccessMismatch",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginAlreadyEnabled",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginEnabledOnlyForRootAccess",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginNotEnabled",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "sender",
                  "type": "address"
                }
              ],
              "name": "PluginRequiresRootAccess",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                }
              ],
              "name": "RootAccessActionExecutionFailed",
              "type": "error"
            },
            {
              "inputs": [],
              "name": "ZeroPageSizeNotAllowed",
              "type": "error"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "nonce",
                  "type": "uint256"
                }
              ],
              "name": "ActionsExecuted",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "bytes4",
                  "name": "selector",
                  "type": "bytes4"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "functionHandler",
                  "type": "address"
                }
              ],
              "name": "FunctionHandlerChanged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "hooksAddress",
                  "type": "address"
                }
              ],
              "name": "HooksChanged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferStarted",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferred",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "PluginDisabled",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "bool",
                  "name": "allowRootAccess",
                  "type": "bool"
                }
              ],
              "name": "PluginEnabled",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "oldRegistry",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newRegistry",
                  "type": "address"
                }
              ],
              "name": "RegistryChanged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "bytes32",
                  "name": "metadataHash",
                  "type": "bytes32"
                }
              ],
              "name": "RootAccessActionExecuted",
              "type": "event"
            },
            {
              "stateMutability": "nonpayable",
              "type": "fallback"
            },
            {
              "inputs": [],
              "name": "acceptOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes32",
                  "name": "",
                  "type": "bytes32"
                },
                {
                  "internalType": "bool",
                  "name": "success",
                  "type": "bool"
                }
              ],
              "name": "checkAfterExecution",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "value",
                  "type": "uint256"
                },
                {
                  "internalType": "bytes",
                  "name": "data",
                  "type": "bytes"
                },
                {
                  "internalType": "enum Enum.Operation",
                  "name": "operation",
                  "type": "uint8"
                },
                {
                  "internalType": "address",
                  "name": "module",
                  "type": "address"
                }
              ],
              "name": "checkModuleTransaction",
              "outputs": [
                {
                  "internalType": "bytes32",
                  "name": "moduleTxHash",
                  "type": "bytes32"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "value",
                  "type": "uint256"
                },
                {
                  "internalType": "bytes",
                  "name": "data",
                  "type": "bytes"
                },
                {
                  "internalType": "enum Enum.Operation",
                  "name": "operation",
                  "type": "uint8"
                },
                {
                  "internalType": "uint256",
                  "name": "safeTxGas",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "baseGas",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "gasPrice",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "gasToken",
                  "type": "address"
                },
                {
                  "internalType": "address payable",
                  "name": "refundReceiver",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "signatures",
                  "type": "bytes"
                },
                {
                  "internalType": "address",
                  "name": "msgSender",
                  "type": "address"
                }
              ],
              "name": "checkTransaction",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "prevPlugin",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "disablePlugin",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                },
                {
                  "internalType": "bool",
                  "name": "allowRootAccess",
                  "type": "bool"
                }
              ],
              "name": "enablePlugin",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "enabledHooks",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "enabledPlugins",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "rootAddressGranted",
                  "type": "bool"
                },
                {
                  "internalType": "address",
                  "name": "nextPluginPointer",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "contract ISafe",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "components": [
                    {
                      "components": [
                        {
                          "internalType": "address payable",
                          "name": "to",
                          "type": "address"
                        },
                        {
                          "internalType": "uint256",
                          "name": "value",
                          "type": "uint256"
                        },
                        {
                          "internalType": "bytes",
                          "name": "data",
                          "type": "bytes"
                        }
                      ],
                      "internalType": "struct SafeProtocolAction",
                      "name": "action",
                      "type": "tuple"
                    },
                    {
                      "internalType": "uint256",
                      "name": "nonce",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes32",
                      "name": "metadataHash",
                      "type": "bytes32"
                    }
                  ],
                  "internalType": "struct SafeRootAccess",
                  "name": "rootAccess",
                  "type": "tuple"
                }
              ],
              "name": "executeRootAccess",
              "outputs": [
                {
                  "internalType": "bytes",
                  "name": "data",
                  "type": "bytes"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "contract ISafe",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "components": [
                    {
                      "components": [
                        {
                          "internalType": "address payable",
                          "name": "to",
                          "type": "address"
                        },
                        {
                          "internalType": "uint256",
                          "name": "value",
                          "type": "uint256"
                        },
                        {
                          "internalType": "bytes",
                          "name": "data",
                          "type": "bytes"
                        }
                      ],
                      "internalType": "struct SafeProtocolAction[]",
                      "name": "actions",
                      "type": "tuple[]"
                    },
                    {
                      "internalType": "uint256",
                      "name": "nonce",
                      "type": "uint256"
                    },
                    {
                      "internalType": "bytes32",
                      "name": "metadataHash",
                      "type": "bytes32"
                    }
                  ],
                  "internalType": "struct SafeTransaction",
                  "name": "transaction",
                  "type": "tuple"
                }
              ],
              "name": "executeTransaction",
              "outputs": [
                {
                  "internalType": "bytes[]",
                  "name": "data",
                  "type": "bytes[]"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "",
                  "type": "bytes4"
                }
              ],
              "name": "functionHandlers",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                }
              ],
              "name": "getEnabledHooks",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "hooksAddress",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "selector",
                  "type": "bytes4"
                }
              ],
              "name": "getFunctionHandler",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "functionHandler",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "getPluginInfo",
              "outputs": [
                {
                  "components": [
                    {
                      "internalType": "bool",
                      "name": "rootAddressGranted",
                      "type": "bool"
                    },
                    {
                      "internalType": "address",
                      "name": "nextPluginPointer",
                      "type": "address"
                    }
                  ],
                  "internalType": "struct SafeProtocolManager.PluginAccessInfo",
                  "name": "enabled",
                  "type": "tuple"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "start",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "pageSize",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                }
              ],
              "name": "getPluginsPaginated",
              "outputs": [
                {
                  "internalType": "address[]",
                  "name": "array",
                  "type": "address[]"
                },
                {
                  "internalType": "address",
                  "name": "next",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "plugin",
                  "type": "address"
                }
              ],
              "name": "isPluginEnabled",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "owner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "pendingOwner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "registry",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "renounceOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes4",
                  "name": "selector",
                  "type": "bytes4"
                },
                {
                  "internalType": "address",
                  "name": "functionHandler",
                  "type": "address"
                }
              ],
              "name": "setFunctionHandler",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "hooks",
                  "type": "address"
                }
              ],
              "name": "setHooks",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "newRegistry",
                  "type": "address"
                }
              ],
              "name": "setRegistry",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes4",
                  "name": "interfaceId",
                  "type": "bytes4"
                }
              ],
              "name": "supportsInterface",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "tempHooksData",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "hooksAddress",
                  "type": "address"
                },
                {
                  "internalType": "bytes",
                  "name": "preCheckData",
                  "type": "bytes"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "testFunction",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "transferOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ]
        },
        "TestSafeProtocolRegistryUnrestricted": {
          "address": "0xe8f280Cb2ddFaE13a9ECF50DEdB8A0BF77534430",
          "abi": [
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "initialOwner",
                  "type": "address"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "CannotAddIntegration",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "CannotFlagIntegration",
              "type": "error"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                },
                {
                  "internalType": "bytes4",
                  "name": "expectedInterfaceId",
                  "type": "bytes4"
                }
              ],
              "name": "IntegrationDoesNotSupportExpectedInterfaceId",
              "type": "error"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "IntegrationAdded",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "IntegrationFlagged",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferStarted",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferred",
              "type": "event"
            },
            {
              "inputs": [],
              "name": "acceptOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                },
                {
                  "internalType": "enum Enum.IntegrationType",
                  "name": "integrationType",
                  "type": "uint8"
                }
              ],
              "name": "addIntegration",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "check",
              "outputs": [
                {
                  "internalType": "uint64",
                  "name": "listedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "uint64",
                  "name": "flaggedAt",
                  "type": "uint64"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "integration",
                  "type": "address"
                }
              ],
              "name": "flagIntegration",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "listedIntegrations",
              "outputs": [
                {
                  "internalType": "uint64",
                  "name": "listedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "uint64",
                  "name": "flaggedAt",
                  "type": "uint64"
                },
                {
                  "internalType": "enum Enum.IntegrationType",
                  "name": "integrationType",
                  "type": "uint8"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "owner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "pendingOwner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "renounceOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "bytes4",
                  "name": "interfaceId",
                  "type": "bytes4"
                }
              ],
              "name": "supportsInterface",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "transferOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ]
        }
      }
    }
  ]
} as const;