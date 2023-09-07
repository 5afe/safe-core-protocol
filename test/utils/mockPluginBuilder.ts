import hre from "hardhat";
import { ISafeProtocolPlugin } from "../../typechain-types";

export const getPluginWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolPlugin> => {
    const plugin = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await plugin.givenMethodReturnBool("0x01ffc9a7", false);
    return hre.ethers.getContractAt("ISafeProtocolPlugin", plugin.target);
};
