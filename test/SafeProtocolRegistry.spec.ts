import { ethers, deployments } from "hardhat";
import { expect } from "chai";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ModuleType } from "./utils/constants";
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

    it("Should allow add a module only once", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockHookAddress = (await getHooksWithPassingChecks()).target;

        await safeProtocolRegistry.connect(owner).addModule(mockHookAddress, ModuleType.Hooks);
        await expect(safeProtocolRegistry.connect(owner).addModule(mockHookAddress, ModuleType.Hooks)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "CannotAddModule",
        );
    });

    it("Should not allow non-owner to add a module", async () => {
        const { safeProtocolRegistry } = await setupTests();
        await expect(safeProtocolRegistry.connect(user1).addModule(AddressZero, ModuleType.Hooks)).to.be.revertedWith(
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
        await safeProtocolRegistry.connect(owner).addModule(mockHookAddress, ModuleType.Hooks);

        await expect(safeProtocolRegistry.connect(user1).flagModule(mockHookAddress)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        expect(await safeProtocolRegistry.connect(owner).flagModule(mockHookAddress));

        const [flaggedAt] = await safeProtocolRegistry.check.staticCall(mockHookAddress);
        expect(flaggedAt).to.be.gt(0);
    });

    it("Should allow only owner to flag a module only once", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockHookAddress = (await getHooksWithPassingChecks()).target;

        await safeProtocolRegistry.connect(owner).addModule(mockHookAddress, ModuleType.Hooks);

        await expect(safeProtocolRegistry.connect(user1).flagModule(mockHookAddress)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        await safeProtocolRegistry.connect(owner).flagModule(mockHookAddress);
        await expect(safeProtocolRegistry.connect(owner).flagModule(mockHookAddress))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "CannotFlagModule")
            .withArgs(mockHookAddress);
    });

    it("Should return (0,0) for non-listed module", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const [listedAt, flaggedAt] = await safeProtocolRegistry.check.staticCall(AddressZero);
        expect(listedAt).to.be.equal(0);
        expect(flaggedAt).to.be.equal(0);
    });

    it("Should return true when valid interfaceId is passed", async () => {
        const { safeProtocolRegistry } = await setupTests();
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0x01ffc9a7")).to.be.true;
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0xc23697a8")).to.be.true;
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
        await expect(safeProtocolRegistry.connect(owner).addModule(mockHookAddress, ModuleType.Hooks))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockHookAddress, "0x907e1c56");
    });

    it("Should revert when adding plugin not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await setupTests();
        const mockPluginAddress = (await getPluginWithFailingCallToSupportsInterfaceMethod()).target;
        await expect(safeProtocolRegistry.connect(owner).addModule(mockPluginAddress, ModuleType.Plugin))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockPluginAddress, "0x6930ebcc");
    });

    it("Should revert when adding function handler not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry, mockFunctionHandlerAddress } = await setupTests();
        await expect(safeProtocolRegistry.connect(owner).addModule(mockFunctionHandlerAddress, ModuleType.FunctionHandler))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "ModuleDoesNotSupportExpectedInterfaceId")
            .withArgs(mockFunctionHandlerAddress, "0xf601ad15");
    });
});
