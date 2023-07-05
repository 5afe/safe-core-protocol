import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ZeroAddress } from "ethers";

describe("RegistryManager", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress, user1: SignerWithAddress;

    before(async () => {
        [deployer, owner, user1] = await hre.ethers.getSigners();
    });

    async function deployContractsFixture() {
        [deployer, owner, user1] = await hre.ethers.getSigners();

        const safeProtocolRegistry = await hre.ethers.deployContract("SafeProtocolRegistry", [owner.address], { signer: deployer });
        const registryManager = await hre.ethers.deployContract(
            "RegistryManager",
            [await safeProtocolRegistry.getAddress(), owner.address],
            { signer: deployer },
        );
        return { registryManager, safeProtocolRegistry };
    }

    it("Should emit RegistryChanged change event when registry is updated", async () => {
        const { registryManager } = await loadFixture(deployContractsFixture);
        await expect(registryManager.connect(user1).setRegistry(ZeroAddress)).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await registryManager.connect(owner).setRegistry(ZeroAddress))
            .to.emit(registryManager, "RegistryChanged")
            .withArgs(await registryManager.getAddress(), ZeroAddress);

        expect(await registryManager.registry()).to.be.equal(ZeroAddress);
    });

    it("Should not allow non-owner to update registry", async () => {
        const safe = await hre.ethers.deployContract("TestExecutor");

        const { registryManager } = await loadFixture(deployContractsFixture);
        await safe.setModule(await registryManager.getAddress());

        await expect(registryManager.connect(user1).setRegistry(ZeroAddress)).to.be.revertedWith("Ownable: caller is not the owner");
    });
});
