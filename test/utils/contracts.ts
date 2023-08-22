import { Addressable, BaseContract } from "ethers";
import hre from "hardhat";
export const getInstance = async <T extends BaseContract>(name: string, address: string | Addressable): Promise<T> => {
    // TODO: this typecasting should be refactored
    return (await hre.ethers.getContractAt(name, address)) as unknown as T;
};
