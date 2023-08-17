import { BaseContract } from "ethers";
import hre from "hardhat";
import { TestExecutor } from "../../typechain-types";
export const getInstance = async <T extends BaseContract>(name: string, address: string): Promise<T> => {
    // TODO: this typecasting should be refactored
    return (await hre.ethers.getContractAt(name, address)) as unknown as T;
};

export const getMockTestExecutorInstance = async (): Promise<TestExecutor> => {
    return await (await hre.ethers.getContractFactory("TestExecutor")).deploy();
};
