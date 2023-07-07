import hre from "hardhat";
import { ISafeProtocolHook } from "../../typechain-types";

export const getHookWithFailingPrechecks = async (): Promise<ISafeProtocolHook> => {
    const hook = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hook.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hook.givenMethodRevertWithMessage("0x7359b742", "pre-check root access failed");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hook.givenMethodRevertWithMessage("0x176ae7b7", "pre-check failed");
    return hre.ethers.getContractAt("ISafeProtocolHook", await hook.getAddress());
};

export const getHookWithPassingPreChecks = async (): Promise<ISafeProtocolHook> => {
    const hook = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hook.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hook.givenMethodRevertWithMessage("0x7359b742", "pre-check root access failed");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hook.givenMethodRevertWithMessage("0x176ae7b7", "pre-check failed");
    return hre.ethers.getContractAt("ISafeProtocolHook", await hook.getAddress());
};

export const getHookWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolHook> => {
    const hook = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hook.givenMethodReturnBool("0x01ffc9a7", false);
    return hre.ethers.getContractAt("ISafeProtocolHook", await hook.getAddress());
};

export const getHookWithPassingChecks = async (): Promise<ISafeProtocolHook> => {
    const hook = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hook.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hook.givenMethodReturn("0x7359b742", "0x");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hook.givenMethodReturn("0x176ae7b7", "0x");
    return hre.ethers.getContractAt("ISafeProtocolHook", await hook.getAddress());
};

export const getHookWithFailingPostCheck = async (): Promise<ISafeProtocolHook> => {
    const hook = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hook.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hook.givenMethodReturn("0x7359b742", "0x");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hook.givenMethodReturn("0x176ae7b7", "0x");
    await hook.givenMethodRevertWithMessage("0xf44d4ca3", "post-check failed");

    return hre.ethers.getContractAt("ISafeProtocolHook", await hook.getAddress());
};
