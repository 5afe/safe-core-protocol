import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ZeroAddress } from "ethers";

describe("GuardManager", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress, user1: SignerWithAddress;

    before(async () => {
        [deployer, owner, user1] = await hre.ethers.getSigners();
    });

    async function deployContractsFixture() {
        [deployer, owner, user1] = await hre.ethers.getSigners();

        const guardManager = await hre.ethers.deployContract("GuardManager", { signer: deployer });

        return { guardManager };
    }

    it("Should emit GuardEnabled event when a guard is enabled", async () => {
        const { guardManager } = await loadFixture(deployContractsFixture);
        const guardAddress = hre.ethers.hexlify(hre.ethers.randomBytes(20));
        expect(await guardManager.connect(user1).setGuard(guardAddress))
            .to.emit(guardManager, "GuardEnabled")
            .withArgs(user1, guardAddress);
    });

    it("Should return correct guard address", async () => {
        const { guardManager } = await loadFixture(deployContractsFixture);
        const guardAddress = hre.ethers.getAddress(hre.ethers.hexlify(hre.ethers.randomBytes(20)));
        await guardManager.connect(user1).setGuard(guardAddress);
        expect(await guardManager.getEnabledGuard(user1.address)).to.be.equal(guardAddress);
    });

    it("Should return zero address if guard is not enabled", async () => {
        const { guardManager } = await loadFixture(deployContractsFixture);
        expect(await guardManager.getEnabledGuard(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });
});
