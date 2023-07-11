import hre from "hardhat";
import { ISafeProtocolGuard } from "../../typechain-types";

export const getGuardWithFailingPrechecks = async (): Promise<ISafeProtocolGuard> => {
    const guard = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await guard.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await guard.givenMethodRevertWithMessage("0x7359b742", "pre-check root access failed");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await guard.givenMethodRevertWithMessage("0x176ae7b7", "pre-check failed");
    return hre.ethers.getContractAt("ISafeProtocolGuard", await guard.getAddress());
};

export const getGuardWithPassingPreChecks = async (): Promise<ISafeProtocolGuard> => {
    const guard = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await guard.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await guard.givenMethodRevertWithMessage("0x7359b742", "pre-check root access failed");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await guard.givenMethodRevertWithMessage("0x176ae7b7", "pre-check failed");
    return hre.ethers.getContractAt("ISafeProtocolGuard", await guard.getAddress());
};

export const getGuardWithFailingCallToSupportsInterfaceMethod = async (): Promise<ISafeProtocolGuard> => {
    const guard = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await guard.givenMethodReturnBool("0x01ffc9a7", false);
    return hre.ethers.getContractAt("ISafeProtocolGuard", await guard.getAddress());
};

export const getGuardWithPassingChecks = async (): Promise<ISafeProtocolGuard> => {
    const guard = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await guard.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await guard.givenMethodReturn("0x7359b742", "0x");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await guard.givenMethodReturn("0x176ae7b7", "0x");
    return hre.ethers.getContractAt("ISafeProtocolGuard", await guard.getAddress());
};

export const getGuardWithFailingPostCheck = async (): Promise<ISafeProtocolGuard> => {
    const guard = await (await hre.ethers.getContractFactory("MockContract")).deploy();
    await guard.givenMethodReturnBool("0x01ffc9a7", true);
    // 0x7359b742 -> selector for preCheckRootAccess
    await guard.givenMethodReturn("0x7359b742", "0x");
    // 0x176ae7b7 -> selector for preCheck(ISafe,SafeTransaction,uint256,bytes)
    await guard.givenMethodReturn("0x176ae7b7", "0x");
    await guard.givenMethodRevertWithMessage("0xf44d4ca3", "post-check failed");

    return hre.ethers.getContractAt("ISafeProtocolGuard", await guard.getAddress());
};
