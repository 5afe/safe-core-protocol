import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { getHooksWithPassingChecks } from "../utils/mockHooksBuilder";

describe("HooksManager", async () => {
    let deployer: SignerWithAddress, user1: SignerWithAddress;

    before(async () => {
        [deployer, user1] = await hre.ethers.getSigners();
    });

    async function deployContractsFixture() {
        [deployer, user1] = await hre.ethers.getSigners();

        const hooksManager = await hre.ethers.deployContract("HooksManager", { signer: deployer });
        const hooks = await getHooksWithPassingChecks();

        return { hooksManager, hooks };
    }

    it("Should emit HooksChanged event when hooks are enabled", async () => {
        const { hooksManager, hooks } = await loadFixture(deployContractsFixture);
        const hooksAddress = await hooks.getAddress();
        expect(await hooksManager.connect(user1).setHooks(hooksAddress))
            .to.emit(hooksManager, "HooksChanged")
            .withArgs(user1, hooksAddress);
    });

    it("Should return correct hooks address", async () => {
        const { hooksManager, hooks } = await loadFixture(deployContractsFixture);
        const hooksAddress = await hooks.getAddress();
        await hooksManager.connect(user1).setHooks(hooksAddress);
        expect(await hooksManager.getEnabledHooks(user1.address)).to.be.equal(hooksAddress);
    });

    it("Should return zero address if hooks are not enabled", async () => {
        const { hooksManager } = await loadFixture(deployContractsFixture);
        expect(await hooksManager.getEnabledHooks(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should return zero address if hooks address is reset to zero address", async () => {
        const { hooksManager, hooks } = await loadFixture(deployContractsFixture);

        const hooksAddress = await hooks.getAddress();
        expect(await hooksManager.connect(user1).setHooks(hooksAddress));
        expect(await hooksManager.connect(user1).setHooks(hre.ethers.ZeroAddress));
        expect(await hooksManager.getEnabledHooks(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should revert if user attempts to set random address as hooks", async () => {
        const { hooksManager } = await loadFixture(deployContractsFixture);
        const hooksAddress = hre.ethers.getAddress(hre.ethers.hexlify(hre.ethers.randomBytes(20)));
        await expect(hooksManager.setHooks(hooksAddress)).to.be.reverted;
    });

    it("Should revert AddressDoesNotImplementHooksInterface if user attempts address does not implement Hooks interface", async () => {
        const { hooksManager } = await loadFixture(deployContractsFixture);
        const contractNotImplementingHooksInterface = await (await hre.ethers.getContractFactory("MockContract")).deploy();
        await contractNotImplementingHooksInterface.givenMethodReturnBool("0x01ffc9a7", false);

        await expect(hooksManager.setHooks(await contractNotImplementingHooksInterface.getAddress())).to.be.revertedWithCustomError(
            hooksManager,
            "AddressDoesNotImplementHooksInterface",
        );
    });
});
