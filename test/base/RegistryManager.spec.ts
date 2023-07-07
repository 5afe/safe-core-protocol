import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ZeroAddress } from "ethers";
import { getMockRegistryWithInvalidInterfaceSupport } from "../utils/mockRegistryBuilder";

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

    it("Should revert when registry address does not implement valid interfaceId", async () => {
        const { registryManager } = await loadFixture(deployContractsFixture);

        await expect(registryManager.connect(owner).setRegistry(ZeroAddress)).to.be.reverted;

        const registry = await getMockRegistryWithInvalidInterfaceSupport();
        await expect(registryManager.connect(owner).setRegistry(await registry.getAddress())).to.be.revertedWithCustomError(
            registryManager,
            "AccountDoesNotImplementValidInterfaceId",
        );
    });

    it("Should revert with AccountDoesNotImplementValidInterfaceId when creating registry manager with registry not supporting valid interfaceId", async () => {
        const registry = await getMockRegistryWithInvalidInterfaceSupport();
        await expect(hre.ethers.deployContract("RegistryManager", [await registry.getAddress(), owner.address], { signer: deployer })).to.be
            .reverted;
    });

    it("Should emit RegistryChanged change event when registry is updated", async () => {
        const { registryManager } = await loadFixture(deployContractsFixture);
        const safeProtocolRegistryAddress = await (
            await hre.ethers.deployContract("SafeProtocolRegistry", [owner.address], { signer: deployer })
        ).getAddress();

        expect(await registryManager.connect(owner).setRegistry(safeProtocolRegistryAddress))
            .to.emit(registryManager, "RegistryChanged")
            .withArgs(await registryManager.getAddress(), safeProtocolRegistryAddress);

        expect(await registryManager.registry()).to.be.equal(safeProtocolRegistryAddress);
    });

    it("Should not allow non-owner to update registry", async () => {
        const safe = await hre.ethers.deployContract("TestExecutor");

        const { registryManager } = await loadFixture(deployContractsFixture);
        await safe.setModule(await registryManager.getAddress());

        await expect(registryManager.connect(user1).setRegistry(ZeroAddress)).to.be.revertedWith("Ownable: caller is not the owner");
    });
});
