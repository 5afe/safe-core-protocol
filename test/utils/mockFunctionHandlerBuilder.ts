import hre from "hardhat";
import { ISafeProtocolFunctionHandler } from "../../typechain-types";

export const getFucntionHandlerWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolFunctionHandler> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();

    // 0x25d6803f -> type(ISafeProtocolFunctionHandler).interfaceId
    await hooks.givenMethodReturnBool("0x25d6803f", false);
    return hre.ethers.getContractAt("ISafeProtocolFunctionHandler", hooks.target);
};
