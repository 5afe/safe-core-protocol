export default {
  "5": [
    {
      "name": "goerli",
      "chainId": "5",
      "contracts": {
        "SafeProtocolManager": {
          "address": "0x4026BA244d773F17FFA2d3173dAFe3fdF94216b9",
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
                  "name": "metaHash",
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
                  "name": "hooksAddress",
                  "type": "address"
                }
              ],
              "name": "AddressDoesNotImplementHooksInterface",
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
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metaHash",
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
              "name": "PluginNotPermitted",
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
                  "name": "metaHash",
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
                  "name": "metaHash",
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
                  "name": "metaHash",
                  "type": "bytes32"
                }
              ],
              "name": "RootAccessActionExecuted",
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
                      "name": "metaHash",
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
                      "name": "metaHash",
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
          "address": "0xc9361a1c6A8DeB0e4bB069820BB3f0Eaf94ae829",
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
              "anonymous": false,
              "inputs": [
                {
                  "indexed": false,
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
                  "indexed": false,
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
        "TestSafeProtocolRegistryUnrestricted": {
          "address": "0x9EFbBcAD12034BC310581B9837D545A951761F5A",
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
              "anonymous": false,
              "inputs": [
                {
                  "indexed": false,
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
                  "indexed": false,
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
          "address": "0xAbd9769A78Ee63632A4fb603D85F63b8D3596DF9",
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
                  "name": "metaHash",
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
                  "name": "hooksAddress",
                  "type": "address"
                }
              ],
              "name": "AddressDoesNotImplementHooksInterface",
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
                  "name": "safe",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "metaHash",
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
              "name": "PluginNotPermitted",
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
                  "name": "metaHash",
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
                  "name": "metaHash",
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
                  "name": "metaHash",
                  "type": "bytes32"
                }
              ],
              "name": "RootAccessActionExecuted",
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
                      "name": "metaHash",
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
                      "name": "metaHash",
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