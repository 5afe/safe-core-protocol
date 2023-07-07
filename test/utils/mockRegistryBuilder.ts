import { ISafeProtocolRegistry } from "../../typechain-types";
import hre from "hardhat";

export const getMockRegistryWithInvalidInterfaceSupport = async (): Promise<ISafeProtocolRegistry> => {
    const registry = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await registry.givenMethodReturnBool("0x01ffc9a7", false);
    return hre.ethers.getContractAt("ISafeProtocolRegistry", await registry.getAddress());
};
