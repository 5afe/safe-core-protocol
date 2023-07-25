import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { IntegrationType } from "./utils/constants";
import { getHooksWithPassingChecks, getHooksWithFailingCallToSupportsInterfaceMethod } from "./utils/mockHooksBuilder";
import { getPluginWithFailingCallToSupportsInterfaceMethod } from "./utils/mockPluginBuilder";
import { getFucntionHandlerWithFailingCallToSupportsInterfaceMethod } from "./utils/mockFunctionHandlerBuilder";
describe("SafeProtocolRegistry", async () => {
    let owner: SignerWithAddress, user1: SignerWithAddress;

    async function deployContractFixture() {
        [owner, user1] = await ethers.getSigners();
        const safeProtocolRegistry = await ethers.deployContract("SafeProtocolRegistry", [owner.address]);
        return { safeProtocolRegistry };
    }

    it("Should allow add a integration only once", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const mockHookAddress = await (await getHooksWithPassingChecks()).getAddress();

        await safeProtocolRegistry.connect(owner).addIntegration(mockHookAddress, IntegrationType.Hooks);
        await expect(
            safeProtocolRegistry.connect(owner).addIntegration(mockHookAddress, IntegrationType.Hooks),
        ).to.be.revertedWithCustomError(safeProtocolRegistry, "CannotAddIntegration");
    });

    it("Should not allow non-owner to add a integration", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await expect(safeProtocolRegistry.connect(user1).addIntegration(AddressZero, IntegrationType.Hooks)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );
    });

    it("Should not allow to flag non-listed integration", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await expect(safeProtocolRegistry.connect(owner).flagIntegration(AddressZero)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "CannotFlagIntegration",
        );
    });

    it("Should allow only owner to flag a integration", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const mockHookAddress = await (await getHooksWithPassingChecks()).getAddress();
        await safeProtocolRegistry.connect(owner).addIntegration(mockHookAddress, IntegrationType.Hooks);

        await expect(safeProtocolRegistry.connect(user1).flagIntegration(mockHookAddress)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        expect(await safeProtocolRegistry.connect(owner).flagIntegration(mockHookAddress));

        const [flaggedAt] = await safeProtocolRegistry.check.staticCall(mockHookAddress);
        expect(flaggedAt).to.be.gt(0);
    });

    it("Should allow only owner to flag a integration only once", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const mockHookAddress = await (await getHooksWithPassingChecks()).getAddress();

        await safeProtocolRegistry.connect(owner).addIntegration(mockHookAddress, IntegrationType.Hooks);

        await expect(safeProtocolRegistry.connect(user1).flagIntegration(mockHookAddress)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        await safeProtocolRegistry.connect(owner).flagIntegration(mockHookAddress);
        await expect(safeProtocolRegistry.connect(owner).flagIntegration(mockHookAddress))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "CannotFlagIntegration")
            .withArgs(mockHookAddress);
    });

    it("Should return (0,0) for non-listed integration", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const [listedAt, flaggedAt] = await safeProtocolRegistry.check.staticCall(AddressZero);
        expect(listedAt).to.be.equal(0);
        expect(flaggedAt).to.be.equal(0);
    });

    it("Should return true when valid interfaceId is passed", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0x01ffc9a7")).to.be.true;
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0xc23697a8")).to.be.true;
    });

    it("Should return false when invalid interfaceId is passed", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0x00000000")).to.be.false;
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0xbaddad42")).to.be.false;
        expect(await safeProtocolRegistry.supportsInterface.staticCall("0xffffffff")).to.be.false;
    });

    it("Should revert when adding hooks not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const mockHookAddress = await (await getHooksWithFailingCallToSupportsInterfaceMethod()).getAddress();
        await expect(safeProtocolRegistry.connect(owner).addIntegration(mockHookAddress, IntegrationType.Hooks))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "IntegrationDoesNotSupportExpectedInterfaceId")
            .withArgs(mockHookAddress, "0x907e1c56");
    });

    it("Should revert when adding plugin not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const mockPluginAddress = await (await getPluginWithFailingCallToSupportsInterfaceMethod()).getAddress();
        await expect(safeProtocolRegistry.connect(owner).addIntegration(mockPluginAddress, IntegrationType.Plugin))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "IntegrationDoesNotSupportExpectedInterfaceId")
            .withArgs(mockPluginAddress, "0x3fce835e");
    });

    it("Should revert when adding function handler not supporting expected interfaceId", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const mockFunctionHandlerAddress = await (await getFucntionHandlerWithFailingCallToSupportsInterfaceMethod()).getAddress();
        await expect(safeProtocolRegistry.connect(owner).addIntegration(mockFunctionHandlerAddress, IntegrationType.FunctionHandler))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "IntegrationDoesNotSupportExpectedInterfaceId")
            .withArgs(mockFunctionHandlerAddress, "0x25d6803f");
    });
});
