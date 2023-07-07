import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SafeProtocolRegistry", async () => {
    let owner: SignerWithAddress, user1: SignerWithAddress;

    async function deployContractFixture() {
        [owner, user1] = await ethers.getSigners();
        const safeProtocolRegistry = await ethers.deployContract("SafeProtocolRegistry", [owner.address]);
        return { safeProtocolRegistry };
    }

    it("Should allow add a component only once", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await safeProtocolRegistry.connect(owner).addComponent(AddressZero);
        await expect(safeProtocolRegistry.connect(owner).addComponent(AddressZero)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "CannotAddComponent",
        );
    });

    it("Should not allow non-owner to add a component", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await expect(safeProtocolRegistry.connect(user1).addComponent(AddressZero)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow to flag non-listed component", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await expect(safeProtocolRegistry.connect(owner).flagComponent(AddressZero)).to.be.revertedWithCustomError(
            safeProtocolRegistry,
            "CannotFlagComponent",
        );
    });

    it("Should allow only owner to flag a component", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await safeProtocolRegistry.connect(owner).addComponent(AddressZero);

        await expect(safeProtocolRegistry.connect(user1).flagComponent(AddressZero)).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await safeProtocolRegistry.connect(owner).flagComponent(AddressZero));

        const [flaggedAt] = await safeProtocolRegistry.check(AddressZero);
        expect(flaggedAt).to.be.gt(0);
    });

    it("Should allow only owner to flag a component only once", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        await safeProtocolRegistry.connect(owner).addComponent(AddressZero);

        await expect(safeProtocolRegistry.connect(user1).flagComponent(AddressZero)).to.be.revertedWith("Ownable: caller is not the owner");

        await safeProtocolRegistry.connect(owner).flagComponent(AddressZero);
        await expect(safeProtocolRegistry.connect(owner).flagComponent(AddressZero))
            .to.be.revertedWithCustomError(safeProtocolRegistry, "CannotFlagComponent")
            .withArgs(AddressZero);
    });

    it("Should return (0,0) for non-listed component", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        const [listedAt, flaggedAt] = await safeProtocolRegistry.check(AddressZero);
        expect(listedAt).to.be.equal(0);
        expect(flaggedAt).to.be.equal(0);
    });

    it("Should return true when valid interfaceId is passed", async () => {
        const { safeProtocolRegistry } = await loadFixture(deployContractFixture);
        expect(await safeProtocolRegistry.supportsInterface("0x01ffc9a7")).to.be.equal(true);
        expect(await safeProtocolRegistry.supportsInterface("0xc23697a8")).to.be.equal(true);
    });
});
