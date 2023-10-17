import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import hre, { deployments } from "hardhat";
import { getRegistry, getSafeProtocolManager, getSignatureValidatorManager } from "./utils/contracts";
import { MaxUint256, toUtf8Bytes } from "ethers";
import {
    MODULE_TYPE_FUNCTION_HANDLER,
    MODULE_TYPE_SIGNATURE_VALIDATOR,
    MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS,
} from "../src/utils/constants";
import { expect } from "chai";
import { getMockSignatureValidationHooks } from "./utils/mockValidationHooksBuilder";

describe("SignatureValidatorManager", () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress;
    const SIGNATURE_SELECTOR = hre.ethers.keccak256(toUtf8Bytes("Account712Signature(bytes32,bytes32,bytes)")).slice(0, 10); // 0xb5c726cb

    before(async () => {
        [deployer, owner] = await hre.ethers.getSigners();
    });

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();

        const safeProtocolSignatureValidatorManager = await getSignatureValidatorManager();
        const safeProtocolManager = await getSafeProtocolManager();

        const safeProtocolRegistry = await getRegistry();
        await safeProtocolRegistry.connect(owner).addModule(safeProtocolSignatureValidatorManager.target, MODULE_TYPE_FUNCTION_HANDLER);

        return { safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry };
    });

    it("Should revert if signature validator is not registered", async () => {
        const { safeProtocolSignatureValidatorManager, safeProtocolManager } = await setupTests();
        const account = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target], { signer: deployer });
        await account.setFallbackHandler(safeProtocolManager.target);

        const setFunctionHandlerData = safeProtocolManager.interface.encodeFunctionData("setFunctionHandler", [
            "0x1626ba7e",
            safeProtocolSignatureValidatorManager.target,
        ]);
        await account.executeCallViaMock(account.target, 0, setFunctionHandlerData, MaxUint256);

        const isValidSignatureInterface = new hre.ethers.Interface([
            "function isValidSignature(bytes32,bytes) public view returns (bytes4)",
        ]);

        const encodedData = new hre.ethers.AbiCoder().encode(
            ["bytes32", "bytes32", "bytes"],
            [hre.ethers.randomBytes(32), hre.ethers.randomBytes(32), hre.ethers.randomBytes(64)],
        );

        const encodeDataWithSelector = hre.ethers.solidityPacked(["bytes4", "bytes"], [SIGNATURE_SELECTOR, encodedData]);

        // ethers.utils.solidityPack(["uint16", "address", "uint256"], [id, creator, amount])

        const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [
            hre.ethers.keccak256(encodeDataWithSelector),
            encodeDataWithSelector,
        ]);

        await expect(account.executeCallViaMock(account.target, 0, data, MaxUint256))
            .to.be.revertedWithCustomError(safeProtocolSignatureValidatorManager, "SignatureValidatorNotSet")
            .withArgs(account.target);
    });

    it("Should call signature validator without validation hooks", async () => {
        const { safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry } = await setupTests();
        const account = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target], { signer: deployer });

        // 1. Set fallback handler
        await account.setFallbackHandler(safeProtocolManager.target);

        // 2. Set function handler
        const setFunctionHandlerData = safeProtocolManager.interface.encodeFunctionData("setFunctionHandler", [
            "0x1626ba7e",
            safeProtocolSignatureValidatorManager.target,
        ]);

        await account.executeCallViaMock(account.target, 0, setFunctionHandlerData, MaxUint256);

        // set up mock contract as a signature validator
        const mockContract = await hre.ethers.deployContract("MockContract", { signer: deployer });
        // 0x38c8d4e6  =>  isValidSignature(address,address,bytes32,bytes32,bytes32,bytes)
        const signatureValidatorReturnValue = new hre.ethers.AbiCoder().encode(["bytes4"], ["0x12345678"]);
        await mockContract.givenMethodReturn("0x38c8d4e6", signatureValidatorReturnValue);

        await mockContract.givenMethodReturnBool("0x01ffc9a7", true);

        await safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR);

        const domainSeparator = hre.ethers.randomBytes(32);

        // 3. Set validator for domain separator
        const dataSetValidatorManager = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidator", [
            domainSeparator,
            mockContract.target,
        ]);

        await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidatorManager, MaxUint256);

        const isValidSignatureInterface = new hre.ethers.Interface([
            "function isValidSignature(bytes32,bytes) public view returns (bytes4)",
        ]);

        const encodedData = new hre.ethers.AbiCoder().encode(
            ["bytes32", "bytes32", "bytes"],
            [domainSeparator, hre.ethers.randomBytes(32), hre.ethers.randomBytes(64)],
        );

        const encodeDataWithSelector = hre.ethers.solidityPacked(["bytes4", "bytes"], [SIGNATURE_SELECTOR, encodedData]);
        const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [
            hre.ethers.keccak256(encodeDataWithSelector),
            encodeDataWithSelector,
        ]);
        expect(await account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.deep.equal([
            true,
            signatureValidatorReturnValue,
        ]);
    });

    it("Should call signature validator with validation hooks", async () => {
        const { safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry } = await setupTests();
        const account = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target], { signer: deployer });

        // 1. Set fallback handler
        await account.setFallbackHandler(safeProtocolManager.target);

        // 2. Set function handler
        const setFunctionHandlerData = safeProtocolManager.interface.encodeFunctionData("setFunctionHandler", [
            "0x1626ba7e",
            safeProtocolSignatureValidatorManager.target,
        ]);

        await account.executeCallViaMock(account.target, 0, setFunctionHandlerData, MaxUint256);

        // set up mock contract as a signature validator
        const mockContract = await hre.ethers.deployContract("MockContract", { signer: deployer });
        // 0x38c8d4e6  =>  isValidSignature(address,address,bytes32,bytes32,bytes32,bytes)
        const signatureValidatorReturnValue = new hre.ethers.AbiCoder().encode(["bytes4"], ["0x12345678"]);
        await mockContract.givenMethodReturn("0x38c8d4e6", signatureValidatorReturnValue);

        await mockContract.givenMethodReturnBool("0x01ffc9a7", true);

        await safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR);

        const domainSeparator = hre.ethers.randomBytes(32);

        // 3. Set validator for domain separator
        const dataSetValidatorManager = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidator", [
            domainSeparator,
            mockContract.target,
        ]);

        await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidatorManager, MaxUint256);

        // 4. Set validation hooks
        const mockSignatureValidatorHooks = await getMockSignatureValidationHooks();
        const dataSetValidationHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidatorHooks", [
            mockSignatureValidatorHooks.target,
        ]);
        await safeProtocolRegistry.connect(owner).addModule(mockSignatureValidatorHooks.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
        await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidationHooks, MaxUint256);

        const isValidSignatureInterface = new hre.ethers.Interface([
            "function isValidSignature(bytes32,bytes) public view returns (bytes4)",
        ]);

        const encodedData = new hre.ethers.AbiCoder().encode(
            ["bytes32", "bytes32", "bytes"],
            [domainSeparator, hre.ethers.randomBytes(32), hre.ethers.randomBytes(64)],
        );

        const encodeDataWithSelector = hre.ethers.solidityPacked(["bytes4", "bytes"], [SIGNATURE_SELECTOR, encodedData]);
        const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [
            hre.ethers.keccak256(encodeDataWithSelector),
            encodeDataWithSelector,
        ]);
        expect(await account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.deep.equal([
            true,
            signatureValidatorReturnValue,
        ]);
    });
});
