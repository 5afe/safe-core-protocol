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

Example: Deploy contracts with [test registry](./contracts/test/TestSafeProtocolRegistryUnrestricted.sol) network to goerli.
```bash
npx hardhat deploy --network goerli --tags test-protocol --export-all deployments.ts
```

### Verify

#### SafeProtocolRegistry.sol/TestSafeProtocolRegistryUnrestricted.sol
```
npx hardhat verify --network goerli <contract_address> <initial_owner>
```

#### SafeProtocolManager.sol
```
npx hardhat verify --network goerli <contract_address> <initial_owner> <registry_address>
```