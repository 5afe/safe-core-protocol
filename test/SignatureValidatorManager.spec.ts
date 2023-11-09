import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import hre, { deployments } from "hardhat";
import { getRegistry, getSafeProtocolManager, getSignatureValidatorManager } from "./utils/contracts";
import { MaxUint256, ZeroAddress } from "ethers";
import {
    MODULE_TYPE_FUNCTION_HANDLER,
    MODULE_TYPE_SIGNATURE_VALIDATOR,
    MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS,
} from "../src/utils/constants";
import { expect } from "chai";
import {
    getMockSignatureValidationHooks,
    getMockSignatureValidationHooksWithFailingPostValidationHook,
    getMockSignatureValidationHooksWithFailingPreValidationHook,
} from "./utils/mockValidationHooksBuilder";
import { SIGNATURE_VALIDATOR_SELECTOR } from "../src/utils/constants";

describe("SignatureValidatorManager", () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress;

    const isValidSignatureInterface = new hre.ethers.Interface(["function isValidSignature(bytes32,bytes) public view returns (bytes4)"]);

    before(async () => {
        [deployer, owner] = await hre.ethers.getSigners();
    });

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();

        const safeProtocolSignatureValidatorManager = await getSignatureValidatorManager();
        const safeProtocolManager = await getSafeProtocolManager();

        const safeProtocolRegistry = await getRegistry();
        await safeProtocolRegistry.connect(owner).addModule(safeProtocolSignatureValidatorManager.target, MODULE_TYPE_FUNCTION_HANDLER);

        const account = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target], { signer: deployer });

        return { account, safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry };
    });

    it("should revert when enabling a signature validator not implementing ISafeProtocolSignatureValidator interface", async () => {
        const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupTests();

        // set up mock contract as a signature validator
        const mockContract = await hre.ethers.deployContract("MockContract", { signer: deployer });
        await mockContract.givenMethodReturnBool("0x01ffc9a7", true);

        await safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR);

        await mockContract.givenMethodReturnBool("0x01ffc9a7", false);

        const domainSeparator = hre.ethers.randomBytes(32);

        const dataSetValidator = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidator", [
            domainSeparator,
            mockContract.target,
        ]);

        await expect(account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidator, MaxUint256))
            .to.be.revertedWithCustomError(safeProtocolSignatureValidatorManager, "ContractDoesNotImplementValidInterfaceId")
            .withArgs(mockContract.target);
    });

    it("should allow to remove signature validator", async () => {
        const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupTests();

        // set up mock contract as a signature validator
        const mockContract = await hre.ethers.deployContract("MockContract", { signer: deployer });
        await mockContract.givenMethodReturnBool("0x01ffc9a7", true);

        await safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR);

        const domainSeparator = hre.ethers.randomBytes(32);

        const dataSetValidator = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidator", [
            domainSeparator,
            mockContract.target,
        ]);

        await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidator, MaxUint256);

        expect(await safeProtocolSignatureValidatorManager.signatureValidators(domainSeparator, account.target)).to.be.equal(
            mockContract.target,
        );

        const dataResetValidator = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidator", [
            domainSeparator,
            hre.ethers.ZeroAddress,
        ]);

        await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataResetValidator, MaxUint256);
        expect(await safeProtocolSignatureValidatorManager.signatureValidators(domainSeparator, account.target)).to.be.equal(ZeroAddress);
    });

    it("should revert when enabling a signature validator hooks not implementing ISafeProtocolSignatureValidatorHooks interface", async () => {
        const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupTests();

        // set up mock contract as a signature validator
        const mockContract = await hre.ethers.deployContract("MockContract", { signer: deployer });
        await mockContract.givenMethodReturnBool("0x01ffc9a7", true);

        await safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);

        await mockContract.givenMethodReturnBool("0x01ffc9a7", false);

        const dataSetValidatorHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidatorHooks", [
            mockContract.target,
        ]);

        await expect(account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidatorHooks, MaxUint256))
            .to.be.revertedWithCustomError(safeProtocolSignatureValidatorManager, "ContractDoesNotImplementValidInterfaceId")
            .withArgs(mockContract.target);
    });

    it("should allow to remove signature validator hooks", async () => {
        const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupTests();

        // set up mock contract as a signature validator
        const mockContract = await hre.ethers.deployContract("MockContract", { signer: deployer });
        await mockContract.givenMethodReturnBool("0x01ffc9a7", true);

        await safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);

        const dataSetValidatorHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidatorHooks", [
            mockContract.target,
        ]);

        await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidatorHooks, MaxUint256);

        expect(await safeProtocolSignatureValidatorManager.signatureValidatorHooks(account.target)).to.be.equal(mockContract.target);

        const dataResetValidator = safeProtocolSignatureValidatorManager.interface.encodeFunctionData("setSignatureValidatorHooks", [
            hre.ethers.ZeroAddress,
        ]);

        await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataResetValidator, MaxUint256);
        expect(await safeProtocolSignatureValidatorManager.signatureValidatorHooks(account.target)).to.be.equal(ZeroAddress);
    });

    describe("signature validation per domain separator", async () => {
        const createPayloadWithSelector = (domainSeparator: Uint8Array, structHash: Uint8Array, signatures: Uint8Array) => {
            const encodedData = new hre.ethers.AbiCoder().encode(
                ["bytes32", "bytes32", "bytes"],
                [domainSeparator, structHash, signatures],
            );

            const encodeDataWithSelector = hre.ethers.solidityPacked(["bytes4", "bytes"], [SIGNATURE_VALIDATOR_SELECTOR, encodedData]);

            const messageHash = hre.ethers.keccak256(
                hre.ethers.solidityPacked(["bytes1", "bytes1", "bytes32", "bytes32"], ["0x19", "0x01", domainSeparator, structHash]),
            );

            const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [messageHash, encodeDataWithSelector]);

            return data;
        };

        it("Should revert if signature validator is not registered", async () => {
            const { account, safeProtocolSignatureValidatorManager, safeProtocolManager } = await setupTests();

            await account.setFallbackHandler(safeProtocolManager.target);

            const setFunctionHandlerData = safeProtocolManager.interface.encodeFunctionData("setFunctionHandler", [
                "0x1626ba7e",
                safeProtocolSignatureValidatorManager.target,
            ]);
            await account.executeCallViaMock(account.target, 0, setFunctionHandlerData, MaxUint256);

            const data = createPayloadWithSelector(hre.ethers.randomBytes(32), hre.ethers.randomBytes(32), hre.ethers.randomBytes(64));

            await expect(account.executeCallViaMock(account.target, 0, data, MaxUint256))
                .to.be.revertedWithCustomError(safeProtocolSignatureValidatorManager, "SignatureValidatorNotSet")
                .withArgs(account.target);
        });

        it("Should call signature validator without validation hooks", async () => {
            const { account, safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry } = await setupTests();

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

            const data = createPayloadWithSelector(domainSeparator, hre.ethers.randomBytes(32), hre.ethers.randomBytes(64));

            expect(await account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.deep.equal([
                true,
                signatureValidatorReturnValue,
            ]);
        });

        it("Should revert if invalid message hash is passed", async () => {
            const { account, safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry } = await setupTests();

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

            let data = createPayloadWithSelector(domainSeparator, hre.ethers.randomBytes(32), hre.ethers.randomBytes(64));
            // replace the message hash
            data = data.substring(0, 10) + hre.ethers.hexlify(hre.ethers.randomBytes(32)).slice(2) + data.substring(74);
            await expect(account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.revertedWithCustomError(
                safeProtocolSignatureValidatorManager,
                "InvalidMessageHash",
            );
        });

        describe("Validation with Hooks", async () => {
            const domainSeparator = hre.ethers.randomBytes(32);
            const signatureValidatorReturnValue = new hre.ethers.AbiCoder().encode(["bytes4"], ["0x12345678"]);

            const setupHooksTests = deployments.createFixture(async () => {
                const { account, safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry } = await setupTests();

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
                await mockContract.givenMethodReturn("0x38c8d4e6", signatureValidatorReturnValue);
                await mockContract.givenMethodReturnBool("0x01ffc9a7", true);

                await safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR);

                // 3. Set validator for domain separator
                const dataSetValidatorManager = safeProtocolSignatureValidatorManager.interface.encodeFunctionData(
                    "setSignatureValidator",
                    [domainSeparator, mockContract.target],
                );

                await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidatorManager, MaxUint256);

                return { account, safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry };
            });

            it("Should revert if pre-validation fails", async () => {
                const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupHooksTests();

                // Set validation hooks
                const mockSignatureValidatorHooks = await getMockSignatureValidationHooksWithFailingPreValidationHook();
                const dataSetValidationHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData(
                    "setSignatureValidatorHooks",
                    [mockSignatureValidatorHooks.target],
                );
                await safeProtocolRegistry
                    .connect(owner)
                    .addModule(mockSignatureValidatorHooks.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
                await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidationHooks, MaxUint256);

                const data = createPayloadWithSelector(domainSeparator, hre.ethers.randomBytes(32), hre.ethers.randomBytes(64));

                await expect(account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.revertedWith(
                    "Pre-validation failed",
                );
            });

            it("Should revert if post-validation fails", async () => {
                const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupHooksTests();

                // Set validation hooks
                const mockSignatureValidatorHooks = await getMockSignatureValidationHooksWithFailingPostValidationHook();
                const dataSetValidationHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData(
                    "setSignatureValidatorHooks",
                    [mockSignatureValidatorHooks.target],
                );
                await safeProtocolRegistry
                    .connect(owner)
                    .addModule(mockSignatureValidatorHooks.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
                await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidationHooks, MaxUint256);

                const data = createPayloadWithSelector(domainSeparator, hre.ethers.randomBytes(32), hre.ethers.randomBytes(64));

                await expect(account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.revertedWith(
                    "Post-validation failed",
                );
            });

            it("Should call signature validator with validation hooks", async () => {
                const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupHooksTests();

                // Set validation hooks
                const mockSignatureValidatorHooks = await getMockSignatureValidationHooks();
                const dataSetValidationHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData(
                    "setSignatureValidatorHooks",
                    [mockSignatureValidatorHooks.target],
                );

                await safeProtocolRegistry
                    .connect(owner)
                    .addModule(mockSignatureValidatorHooks.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
                await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidationHooks, MaxUint256);

                const data = createPayloadWithSelector(domainSeparator, hre.ethers.randomBytes(32), hre.ethers.randomBytes(64));

                expect(await account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.deep.equal([
                    true,
                    signatureValidatorReturnValue,
                ]);
            });
        });
    });

    describe("default signature validation flow", async () => {
        it("Should call default signature validator without validation hooks", async () => {
            const { account, safeProtocolSignatureValidatorManager, safeProtocolManager } = await setupTests();

            // 1. Set fallback handler
            await account.setFallbackHandler(safeProtocolManager.target);

            // 2. Set function handler
            const setFunctionHandlerData = safeProtocolManager.interface.encodeFunctionData("setFunctionHandler", [
                "0x1626ba7e",
                safeProtocolSignatureValidatorManager.target,
            ]);

            await account.executeCallViaMock(account.target, 0, setFunctionHandlerData, MaxUint256);

            const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [
                hre.ethers.randomBytes(32),
                hre.ethers.randomBytes(65),
            ]);

            expect(await account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.deep.equal([
                true,
                "0x000000000000000000000000000000000000000000000000000000001626ba7e",
            ]);
        });

        describe("Validation with Hooks", async () => {
            const setupHooksTests = deployments.createFixture(async () => {
                const { account, safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry } = await setupTests();

                // 1. Set fallback handler
                await account.setFallbackHandler(safeProtocolManager.target);

                // 2. Set function handler
                const setFunctionHandlerData = safeProtocolManager.interface.encodeFunctionData("setFunctionHandler", [
                    "0x1626ba7e",
                    safeProtocolSignatureValidatorManager.target,
                ]);
                await account.executeCallViaMock(account.target, 0, setFunctionHandlerData, MaxUint256);

                // 3. Set validation hooks
                const mockSignatureValidatorHooks = await getMockSignatureValidationHooks();
                await safeProtocolRegistry
                    .connect(owner)
                    .addModule(mockSignatureValidatorHooks.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);

                const dataSetValidationHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData(
                    "setSignatureValidatorHooks",
                    [mockSignatureValidatorHooks.target],
                );
                await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidationHooks, MaxUint256);

                return { account, safeProtocolSignatureValidatorManager, safeProtocolManager, safeProtocolRegistry };
            });

            it("Should call default signature validator with validation hooks", async () => {
                const { account } = await setupHooksTests();

                const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [
                    hre.ethers.randomBytes(32),
                    hre.ethers.randomBytes(65),
                ]);

                expect(await account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.deep.equal([
                    true,
                    "0x000000000000000000000000000000000000000000000000000000001626ba7e",
                ]);
            });

            it("Should revert if pre-validation fails", async () => {
                const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupHooksTests();

                // Set validation hooks
                const mockSignatureValidatorHooks = await getMockSignatureValidationHooksWithFailingPreValidationHook();
                const dataSetValidationHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData(
                    "setSignatureValidatorHooks",
                    [mockSignatureValidatorHooks.target],
                );

                await safeProtocolRegistry
                    .connect(owner)
                    .addModule(mockSignatureValidatorHooks.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
                await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidationHooks, MaxUint256);

                const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [
                    hre.ethers.randomBytes(32),
                    hre.ethers.randomBytes(65),
                ]);

                await expect(account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.revertedWith(
                    "Pre-validation failed",
                );
            });

            it("Should revert if post-validation fails", async () => {
                const { account, safeProtocolSignatureValidatorManager, safeProtocolRegistry } = await setupHooksTests();

                // Set validation hooks
                const mockSignatureValidatorHooks = await getMockSignatureValidationHooksWithFailingPostValidationHook();
                const dataSetValidationHooks = safeProtocolSignatureValidatorManager.interface.encodeFunctionData(
                    "setSignatureValidatorHooks",
                    [mockSignatureValidatorHooks.target],
                );
                await safeProtocolRegistry
                    .connect(owner)
                    .addModule(mockSignatureValidatorHooks.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS);
                await account.executeCallViaMock(safeProtocolSignatureValidatorManager.target, 0, dataSetValidationHooks, MaxUint256);

                const data = isValidSignatureInterface.encodeFunctionData("isValidSignature", [
                    hre.ethers.randomBytes(32),
                    hre.ethers.randomBytes(65),
                ]);

                await expect(account.executeCallViaMock.staticCall(account.target, 0, data, MaxUint256)).to.be.revertedWith(
                    "Post-validation failed",
                );
            });
        });
    });

    it("call metadataProvider() for increasing coverage", async () => {
        const { safeProtocolSignatureValidatorManager } = await setupTests();
        expect(await safeProtocolSignatureValidatorManager.metadataProvider());
    });

    it("Should return true when valid interfaceId is passed", async () => {
        const { safeProtocolSignatureValidatorManager } = await setupTests();
        expect(await safeProtocolSignatureValidatorManager.supportsInterface.staticCall("0x01ffc9a7")).to.be.true;
        expect(await safeProtocolSignatureValidatorManager.supportsInterface.staticCall("0x86080c7a")).to.be.true;
        expect(await safeProtocolSignatureValidatorManager.supportsInterface.staticCall("0xf601ad15")).to.be.true;
    });

    it("Should return false when invalid interfaceId is passed", async () => {
        const { safeProtocolSignatureValidatorManager } = await setupTests();
        expect(await safeProtocolSignatureValidatorManager.supportsInterface.staticCall("0x00000000")).to.be.false;
        expect(await safeProtocolSignatureValidatorManager.supportsInterface.staticCall("0xbaddad42")).to.be.false;
        expect(await safeProtocolSignatureValidatorManager.supportsInterface.staticCall("0xffffffff")).to.be.false;
    });
});
