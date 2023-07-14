# Safe protocol

This project is an implementation of [Safe protocol specification](https://github.com/5afe/safe-protocol-specs)

## Useful commands

### Install

```bash
yarn
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

### Deploy

- Deploy test contracts network to goerli.
    - [test registry](./contracts/test/TestSafeProtocolRegistryUnrestricted.sol)
    - [test manager](./contracts/test/TestSafeProtocolManager.sol)
    ```bash
    yarn hardhat deploy --network goerli --tags test-protocol --export-all deployments.ts
    ```
- Deploy contracts with [SafeProtocolRegistry](./contracts/test/TestSafeProtocolRegistryUnrestricted.sol) registry network to goerli.
    ```bash
    yarn hardhat deploy --network goerli --tags protocol --export-all deployments.ts
    ```

### Verify

#### SafeProtocolRegistry.sol/TestSafeProtocolRegistryUnrestricted.sol
```
yarn hardhat verify --network goerli <contract_address> <initial_owner>
```

#### SafeProtocolManager.sol
```
yarn hardhat verify --network goerli <contract_address> <initial_owner> <registry_address>
```