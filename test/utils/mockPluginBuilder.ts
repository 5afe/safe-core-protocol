import hre from "hardhat";
import { ISafeProtocolPlugin } from "../../typechain-types";

export const getPluginWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolPlugin> => {
    const plugin = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    // 0x3fce835e -> type(ISafeProtocolPlugin).interfaceId
    await plugin.givenMethodReturnBool("0x3fce835e", false);
    return hre.ethers.getContractAt("ISafeProtocolPlugin", plugin.target);
};
