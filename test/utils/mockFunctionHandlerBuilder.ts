import hre from "hardhat";
import { ISafeProtocolFunctionHandler } from "../../typechain-types";

export const getFunctionHandlerWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolFunctionHandler> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();

    // 0x25d6803f -> type(ISafeProtocolFunctionHandler).interfaceId
    await hooks.givenMethodReturnBool("0x01ffc9a7", false);
    return hre.ethers.getContractAt("ISafeProtocolFunctionHandler", hooks.target);
};

export const getMockFunctionHandler = async (): Promise<ISafeProtocolFunctionHandler> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();

    // 0x25d6803f -> type(ISafeProtocolFunctionHandler).interfaceId
    await hooks.givenMethodReturnBool("0x01ffc9a7", true);

    // 0xf8a8fd6d -> function test() external {}
    await hooks.givenMethodReturnBool("0xf8a8fd6d", true);

    return hre.ethers.getContractAt("ISafeProtocolFunctionHandler", hooks.target);
};
