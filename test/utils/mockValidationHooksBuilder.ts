import hre from "hardhat";
import { ISafeProtocolSignatureValidatorHooks } from "../../typechain-types";

export const getMockSignatureValidationHooks = async (): Promise<ISafeProtocolSignatureValidatorHooks> => {
    const signatureValidationHooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();

    // Supports IERC165
    await signatureValidationHooks.givenMethodReturnBool("0x01ffc9a7", true);

    // 0x3964efae  =>  preValidationHook(address,address,bytes)
    // 0xea243a01  =>  postValidationHook(address,bytes)
    await signatureValidationHooks.givenMethodReturn("0x3964efae", hre.ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], ["0x1234"]));
    await signatureValidationHooks.givenMethodReturn("0xea243a01", hre.ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], ["0x1234"]));

    return hre.ethers.getContractAt("ISafeProtocolSignatureValidatorHooks", signatureValidationHooks.target);
};

export const getMockSignatureValidationHooksWithFailingPreValidationHook = async (): Promise<ISafeProtocolSignatureValidatorHooks> => {
    const signatureValidationHooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();

    // Supports IERC165
    await signatureValidationHooks.givenMethodReturnBool("0x01ffc9a7", true);

    // 0x3964efae  =>  preValidationHook(address,address,bytes)
    await signatureValidationHooks.givenMethodRevertWithMessage("0x3964efae", "Pre-validation failed");
    return hre.ethers.getContractAt("ISafeProtocolSignatureValidatorHooks", signatureValidationHooks.target);
};

export const getMockSignatureValidationHooksWithFailingPostValidationHook = async (): Promise<ISafeProtocolSignatureValidatorHooks> => {
    const signatureValidationHooks = await (await hre.ethers.getContractFactory("MockContract")).deploy();

    // Supports IERC165
    await signatureValidationHooks.givenMethodReturnBool("0x01ffc9a7", true);

    // 0xea243a01  =>  postValidationHook(address,bytes)
    await signatureValidationHooks.givenMethodRevertWithMessage("0xea243a01", "Post-validation failed");
    return hre.ethers.getContractAt("ISafeProtocolSignatureValidatorHooks", signatureValidationHooks.target);
};
