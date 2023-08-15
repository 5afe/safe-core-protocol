import hre from "hardhat";
import { ISafeProtocolFunctionHandler } from "../../typechain-types";

export const getFunctionHandlerWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolFunctionHandler> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hooks.givenMethodReturnBool("0x01ffc9a7", false);
    return hre.ethers.getContractAt("ISafeProtocolFunctionHandler", hooks.target);
};

export const getMockFunctionHandler = async (): Promise<ISafeProtocolFunctionHandler> => {
    const functionHandler = await (await hre.ethers.getContractFactory("MockContract")).deploy();

    // Supports IERC165
    await functionHandler.givenMethodReturnBool("0x01ffc9a7", true);

    // Call to handle(address,address,uint256,bytes)
    await functionHandler.givenMethodReturn("0x25d6803f", "0x");

    return hre.ethers.getContractAt("ISafeProtocolFunctionHandler", functionHandler.target);
};
