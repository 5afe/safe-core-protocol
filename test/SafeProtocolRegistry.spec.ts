import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { AddressZero } from "@ethersproject/constants";

describe("SafeProtocolRegistry", async () => {
    async function deployContractFixture() {
        const safeProtocolRegistry = await ethers.deployContract("SafeProtocolRegistry");
        return { safeProtocolRegistry };
    }

    it("Should allow to add a component only once", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await safeProtocolRegistry.addComponent(AddressZero);
        await expect(safeProtocolRegistry.addComponent(AddressZero)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "CannotAddComponent",
        );
    });

    it("Should not allow to flag non-listed component", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await expect(safeProtocolRegistry.flagComponent(AddressZero)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "CannotFlagComponent",
        );
    });

    it("Should return (0,0) for non-listed component", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const [listedAt, flaggedAt] = await safeProtocolRegistry.check(AddressZero);
        expect(listedAt).to.be.equal(0);
        expect(flaggedAt).to.be.equal(0);
    });
});
