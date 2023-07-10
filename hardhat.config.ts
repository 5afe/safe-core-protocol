import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import dotenv from "dotenv";
import yargs from "yargs";
import { HttpNetworkUserConfig } from "hardhat/types";
import "hardhat-deploy";
import { DeterministicDeploymentInfo } from "hardhat-deploy/dist/types";

// Load environment variables.
dotenv.config();

const argv : any = yargs
    .option("network", {
        type: "string",
        default: "hardhat",
    })
    .help(false)
    .version(false).argv;

const { NODE_URL, MNEMONIC, INFURA_KEY, ETHERSCAN_API_KEY} = process.env;

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
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    owner: {
      default: 1
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
