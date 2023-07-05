import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GuardManager", async () => {
    let deployer: SignerWithAddress, user1: SignerWithAddress;

    before(async () => {
        [deployer, user1] = await hre.ethers.getSigners();
    });

    async function deployContractsFixture() {
        [deployer, user1] = await hre.ethers.getSigners();

        const guardManager = await hre.ethers.deployContract("GuardManager", { signer: deployer });
        const guard = await hre.ethers.deployContract("TestGuard", { signer: deployer });

        return { guardManager, guard };
    }

    it("Should emit GuardEnabled event when a guard is enabled", async () => {
        const { guardManager, guard } = await loadFixture(deployContractsFixture);
        const guardAddress = await guard.getAddress();
        expect(await guardManager.connect(user1).setGuard(guardAddress))
            .to.emit(guardManager, "GuardEnabled")
            .withArgs(user1, guardAddress);
    });

    it("Should return correct guard address", async () => {
        const { guardManager, guard } = await loadFixture(deployContractsFixture);
        const guardAddress = await guard.getAddress();
        await guardManager.connect(user1).setGuard(guardAddress);
        expect(await guardManager.getEnabledGuard(user1.address)).to.be.equal(guardAddress);
    });

    it("Should return zero address if guard is not enabled", async () => {
        const { guardManager } = await loadFixture(deployContractsFixture);
        expect(await guardManager.getEnabledGuard(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should return zero address if guard address is reset to zero address", async () => {
        const { guardManager, guard } = await loadFixture(deployContractsFixture);

        const guardAddress = await guard.getAddress();
        expect(await guardManager.connect(user1).setGuard(guardAddress));
        expect(await guardManager.connect(user1).setGuard(hre.ethers.ZeroAddress));
        expect(await guardManager.getEnabledGuard(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should revert if user attempts to set random address as guard", async () => {
        const { guardManager } = await loadFixture(deployContractsFixture);
        const guardAddress = hre.ethers.getAddress(hre.ethers.hexlify(hre.ethers.randomBytes(20)));
        await expect(guardManager.setGuard(guardAddress)).to.be.reverted;
    });

    it("Should revert AddressDoesNotImplementGuardInterface if user attempts address does not implement Guard interface", async () => {
        const { guardManager } = await loadFixture(deployContractsFixture);
        const contractNotImplementingGuardInterface = hre.ethers.deployContract("TestContractNotImplementingGuardInterface");

        await expect(guardManager.setGuard((await contractNotImplementingGuardInterface).getAddress())).to.be.revertedWithCustomError(
            guardManager,
            "AddressDoesNotImplementGuardInterface",
        );
    });
});
