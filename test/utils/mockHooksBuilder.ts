import hre from "hardhat";
import { ISafeProtocolHooks } from "../../typechain-types";

export const getHooksWithFailingPrechecks = async (): Promise<ISafeProtocolHooks> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hooks.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hooks.givenMethodRevertWithMessage("0x7359b742", "pre-check root access failed");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hooks.givenMethodRevertWithMessage("0x176ae7b7", "pre-check failed");
    return hre.ethers.getContractAt("ISafeProtocolHooks", hooks.target);
};

export const getHooksWithFailingPreChecks = async (): Promise<ISafeProtocolHooks> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hooks.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hooks.givenMethodRevertWithMessage("0x7359b742", "pre-check root access failed");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hooks.givenMethodRevertWithMessage("0x176ae7b7", "pre-check failed");
    return hre.ethers.getContractAt("ISafeProtocolHooks", hooks.target);
};

export const getHooksWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolHooks> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hooks.givenMethodReturnBool("0x907e1c56", false);
    return hre.ethers.getContractAt("ISafeProtocolHooks", hooks.target);
};

export const getHooksWithPassingChecks = async (): Promise<ISafeProtocolHooks> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hooks.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hooks.givenMethodReturn("0x7359b742", "0x");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hooks.givenMethodReturn("0x176ae7b7", "0x");
    return hre.ethers.getContractAt("ISafeProtocolHooks", hooks.target);
};

export const getHooksWithFailingPostCheck = async (): Promise<ISafeProtocolHooks> => {
    const hooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await hooks.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await hooks.givenMethodReturn("0x7359b742", "0x");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await hooks.givenMethodReturn("0x176ae7b7", "0x");
    await hooks.givenMethodRevertWithMessage("0xf44d4ca3", "post-check failed");

    return hre.ethers.getContractAt("ISafeProtocolHooks", hooks.target);
};
