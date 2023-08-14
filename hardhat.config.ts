import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import dotenv from "dotenv";
import yargs from "yargs";
import { HttpNetworkUserConfig } from "hardhat/types";
import "hardhat-deploy";
import { DeterministicDeploymentInfo } from "hardhat-deploy/dist/types";
import { getSingletonFactoryInfo } from "@safe-global/safe-singleton-factory";
import { ethers } from "ethers";
import "./src/tasks/generate_deployments_markdown";
import "./src/tasks/show_codesize";

// Load environment variables.
dotenv.config();

const argv : any = yargs
    .option("network", {
        type: "string",
        default: "hardhat",
    })
    .help(false)
    .version(false).argv;

const { NODE_URL, MNEMONIC, INFURA_KEY, ETHERSCAN_API_KEY, SAFE_CORE_PROTOCOL_OWNER_ADDRESS } = process.env;

const deterministicDeployment = (network: string): DeterministicDeploymentInfo => {
  const info = getSingletonFactoryInfo(parseInt(network));
  if (!info) {
      throw new Error(`
      Safe factory not found for network ${network}. You can request a new deployment at https://github.com/safe-global/safe-singleton-factory.
      For more information, see https://github.com/safe-global/safe-contracts#replay-protection-eip-155
    `);
  }
  return {
      factory: info.address,
      deployer: info.signerAddress,
      funding: (ethers.toBigInt(info.gasLimit) * (ethers.toBigInt(info.gasPrice))).toString(),
      signedTx: info.transaction,
  };
};


if (["goerli", "mumbai"].includes(argv.network) && INFURA_KEY === undefined) {
  throw new Error(`Could not find NODE_URL in env, unable to connect to network ${argv.network}`);
}

const sharedNetworkConfig: HttpNetworkUserConfig = {};

sharedNetworkConfig.accounts = {
  mnemonic: MNEMONIC || ""
}

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000,
      gas: 100000000,
    },
    goerli: {
      ...sharedNetworkConfig,
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
    },
    mumbai: {
      ...sharedNetworkConfig,
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
    },
    gnosis: {
      ...sharedNetworkConfig,
      url: "https://rpc.gnosischain.com",
    }
  },
  deterministicDeployment,
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    owner: {
      default: SAFE_CORE_PROTOCOL_OWNER_ADDRESS || 1
    }
  }
};

if (NODE_URL) {
  config.networks!.custom = {
      ...sharedNetworkConfig,
      url: NODE_URL,
  };
}

export default config;
