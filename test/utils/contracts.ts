import { Addressable, BaseContract } from "ethers";
import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SafeProtocolManager, SafeProtocolRegistry, SignatureValidatorManager } from "../../typechain-types";

export const getInstance = async <T extends BaseContract>(name: string, address: string | Addressable): Promise<T> => {
    // TODO: this typecasting should be refactored
    return (await hre.ethers.getContractAt(name, address)) as unknown as T;
};

export const getSingleton = async <T extends BaseContract>(hre: HardhatRuntimeEnvironment, name: string): Promise<T> => {
    const deployment = await hre.deployments.get(name);
    return getInstance<T>(name, deployment.address);
};

export const getSignatureValidatorManager = async () => getSingleton<SignatureValidatorManager>(hre, "SignatureValidatorManager");
export const getSafeProtocolManager = async () => getSingleton<SafeProtocolManager>(hre, "SafeProtocolManager");
export const getRegistry = async () => getSingleton<SafeProtocolRegistry>(hre, "SafeProtocolRegistry");
