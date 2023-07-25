import hre from "hardhat";
import { ISafeProtocolPlugin } from "../../typechain-types";

export const getPluginWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolPlugin> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    // 0x3fce835e -> type(ISafeProtocolPlugin).interfaceId
    await hooks.givenMethodReturnBool("0x3fce835e", false);
    return hre.ethers.getContractAt("ISafeProtocolPlugin", await hooks.getAddress());
};
