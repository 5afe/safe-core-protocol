import hre, { ethers, deployments } from "hardhat";
import { expect } from "chai";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
    MODULE_TYPE_PLUGIN,
    MODULE_TYPE_HOOKS,
    MODULE_TYPE_FUNCTION_HANDLER,
    MODULE_TYPE_SIGNATURE_VALIDATOR,
    MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS,
} from "../src/utils/constants";
import { getHooksWithPassingChecks, getHooksWithFailingCallToSupportsInterfaceMethod } from "./utils/mockHooksBuilder";
import { getPluginWithFailingCallToSupportsInterfaceMethod } from "./utils/mockPluginBuilder";
import { getFunctionHandlerWithFailingCallToSupportsInterfaceMethod } from "./utils/mockFunctionHandlerBuilder";
describe("SafeProtocolRegistry", async () => {
    let owner: SignerWithAddress, user1: SignerWithAddress;

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        [owner, user1] = await ethers.getSigners();
        const safeProtocolRegistry = await ethers.deployContract("SafeProtocolRegistry", [owner.address]);
        const mockFunctionHandlerAddress = (await getFunctionHandlerWithFailingCallToSupportsInterfaceMethod()).target;
        return { safeProtocolRegistry, mockFunctionHandlerAddress };
    });

    // A helper function to convert a number to a bytes32 value
    const numberToBytes32 = (value: number) => hre.ethers.zeroPadValue(hre.ethers.toBeHex(value), 32);

    it("Should allow adding a module only once", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockHookAddress = (await getHooksWithPassingChecks()).target;

        await safeProtocolRegistry.connect(owner).addModule(mockHookAddress, MODULE_TYPE_HOOKS);
        await expect(safeProtocolRegistry.connect(owner).addModule(mockHookAddress, MODULE_TYPE_HOOKS)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "ModuleAlreadyListed",
        );
    });

    it("Should allow adding a module with multiple types", async () => {
        const { safeProtocolRegistry } = await setupTests();

        const mockModule = await (await hre.ethers.getContractFactory("MockContract")).deploy();
        await mockModule.givenMethodReturnBool("0x01ffc9a7", true);

        await safeProtocolRegistry
            .connect(owner)
            .addModule(
                mockModule,
                MODULE_TYPE_PLUGIN +
                    MODULE_TYPE_FUNCTION_HANDLER +
                    MODULE_TYPE_HOOKS +
                    MODULE_TYPE_SIGNATURE_VALIDATOR +
                    MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS,
            );

        const [listedAt, flaggedAt] = await safeProtocolRegistry.check.staticCall(
            mockModule.target,
            numberToBytes32(MODULE_TYPE_FUNCTION_HANDLER),
        );

        expect(listedAt).to.be.greaterThan(0);
        expect(flaggedAt).to.be.equal(0);

        const [listedAt2, flaggedAt2] = await safeProtocolRegistry.check.staticCall(mockModule.target, numberToBytes32(MODULE_TYPE_PLUGIN));
        expect(listedAt2).to.be.greaterThan(0);
        expect(flaggedAt2).to.be.equal(0);

        const [listedAt3, flaggedAt3] = await safeProtocolRegistry.check.staticCall(mockModule.target, numberToBytes32(MODULE_TYPE_HOOKS));
        expect(listedAt3).to.be.greaterThan(0);
        expect(flaggedAt3).to.be.equal(0);

        const [listedAt4, flaggedAt4] = await safeProtocolRegistry.check.staticCall(
            mockModule.target,
            numberToBytes32(MODULE_TYPE_SIGNATURE_VALIDATOR),
        );
        expect(listedAt4).to.be.greaterThan(0);
        expect(flaggedAt4).to.be.equal(0);

        const [listedAt5, flaggedAt5] = await safeProtocolRegistry.check.staticCall(
            mockModule.target,
            numberToBytes32(MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS),
        );
        expect(listedAt5).to.be.greaterThan(0);
        expect(flaggedAt5).to.be.equal(0);
    });

    it("Should not allow adding a module with invalid moduleTypes", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockHookAddress = (await getHooksWithPassingChecks()).target;

        await expect(safeProtocolRegistry.connect(owner).addModule(mockHookAddress, 32))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "InvalidModuleType")
            .withArgs(mockHookAddress, 32);
    });

    it("Should not allow non-owner to add a module", async () => {
        const { safeProtocolRegistry } = await setupTests();
        await expect(safeProtocolRegistry.connect(user1).addModule(AddressZero, MODULE_TYPE_HOOKS)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );
    });

    it("Should not allow to flag non-listed module", async () => {
        const { safeProtocolRegistry } = await setupTests();
        await expect(safeProtocolRegistry.connect(owner).flagModule(AddressZero)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "CannotFlagModule",
        );
    });

    it("Should allow only owner to flag a module", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockHookAddress = (await getHooksWithPassingChecks()).target;
        await safeProtocolRegistry.connect(owner).addModule(mockHookAddress, MODULE_TYPE_HOOKS);

        await expect(safeProtocolRegistry.connect(user1).flagModule(mockHookAddress)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        expect(await safeProtocolRegistry.connect(owner).flagModule(mockHookAddress));

        const [listedAt, flaggedAt] = await safeProtocolRegistry.check.staticCall(mockHookAddress, numberToBytes32(MODULE_TYPE_HOOKS));
        expect(listedAt).to.be.gt(0);
        expect(flaggedAt).to.be.gt(0);
    });

    it("Should allow only owner to flag a module only once", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockHookAddress = (await getHooksWithPassingChecks()).target;

        await safeProtocolRegistry.connect(owner).addModule(mockHookAddress, MODULE_TYPE_HOOKS);

        await expect(safeProtocolRegistry.connect(user1).flagModule(mockHookAddress)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        await safeProtocolRegistry.connect(owner).flagModule(mockHookAddress);
        await expect(safeProtocolRegistry.connect(owner).flagModule(mockHookAddress))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "CannotFlagModule")
            .withArgs(mockHookAddress);
    });

    it("Should return (0,0,0) for non-listed module", async () => {
        const { safeProtocolRegistry } = await setupTests();

        const [listedAt, flaggedAt] = await safeProtocolRegistry.check.staticCall(AddressZero, numberToBytes32(MODULE_TYPE_PLUGIN));
        expect(listedAt).to.be.equal(0);
        expect(flaggedAt).to.be.equal(0);

        const [listedAt2, flaggedAt2] = await safeProtocolRegistry.check.staticCall(
            AddressZero,
            numberToBytes32(MODULE_TYPE_FUNCTION_HANDLER),
        );
        expect(listedAt2).to.be.equal(0);
        expect(flaggedAt2).to.be.equal(0);

        const [listedAt3, flaggedAt3] = await safeProtocolRegistry.check.staticCall(AddressZero, numberToBytes32(MODULE_TYPE_HOOKS));
        expect(listedAt3).to.be.equal(0);
        expect(flaggedAt3).to.be.equal(0);
    });

    it("Should return true when valid interfaceId is passed", async () => {
        const { safeProtocolRegistry } = await setupTests();
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0x01ffc9a7")).to.be.true;
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0x253bd7b7")).to.be.true;
    });

    it("Should return false when invalid interfaceId is passed", async () => {
        const { safeProtocolRegistry } = await setupTests();
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0x00000000")).to.be.false;
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0xbaddad42")).to.be.false;
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0xffffffff")).to.be.false;
    });

    it("Should revert when adding hooks not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockHookAddress = (await getHooksWithFailingCallToSupportsInterfaceMethod()).target;
        await expect(safeProtocolRegistry.connect(owner).addModule(mockHookAddress, MODULE_TYPE_HOOKS))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockHookAddress, "0x907e1c56");
    });

    it("Should revert when adding plugin not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockPluginAddress = (await getPluginWithFailingCallToSupportsInterfaceMethod()).target;
        await expect(safeProtocolRegistry.connect(owner).addModule(mockPluginAddress, MODULE_TYPE_PLUGIN))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockPluginAddress, "0x6930ebcc");
    });

    it("Should revert when adding function handler not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry, mockFunctionHandlerAddress } = await setupTests();
        await expect(safeProtocolRegistry.connect(owner).addModule(mockFunctionHandlerAddress, MODULE_TYPE_FUNCTION_HANDLER))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockFunctionHandlerAddress, "0xf601ad15");
    });

    it("Should revert when signature validator hooks not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockContract = await (await hre.ethers.getContractFactory("MockContract")).deploy();
        await mockContract.givenMethodReturnBool("0x01ffc9a7", false);

        await expect(safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR_HOOKS))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockContract.target, "0xd340d5af");
    });

    it("Should revert when signature validator not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockContract = await (await hre.ethers.getContractFactory("MockContract")).deploy();
        await mockContract.givenMethodReturnBool("0x01ffc9a7", false);

        await expect(safeProtocolRegistry.connect(owner).addModule(mockContract.target, MODULE_TYPE_SIGNATURE_VALIDATOR))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockContract.target, "0x38c8d4e6");
    });
});
