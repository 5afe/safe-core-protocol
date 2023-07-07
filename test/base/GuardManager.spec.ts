import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { getHookWithPassingChecks } from "../utils/mockHookBuilder";

describe("HookManager", async () => {
    let deployer: SignerWithAddress, user1: SignerWithAddress;

    before(async () => {
        [deployer, user1] = await hre.ethers.getSigners();
    });

    async function deployContractsFixture() {
        [deployer, user1] = await hre.ethers.getSigners();

        const hookManager = await hre.ethers.deployContract("HookManager", { signer: deployer });
        const hook = await getHookWithPassingChecks();

        return { hookManager, hook };
    }

    it("Should emit HookEnabled event when a hook is enabled", async () => {
        const { hookManager, hook } = await loadFixture(deployContractsFixture);
        const hookAddress = await hook.getAddress();
        expect(await hookManager.connect(user1).setHook(hookAddress))
            .to.emit(hookManager, "HookEnabled")
            .withArgs(user1, hookAddress);
    });

    it("Should return correct hook address", async () => {
        const { hookManager, hook } = await loadFixture(deployContractsFixture);
        const hookAddress = await hook.getAddress();
        await hookManager.connect(user1).setHook(hookAddress);
        expect(await hookManager.getEnabledHook(user1.address)).to.be.equal(hookAddress);
    });

    it("Should return zero address if hook is not enabled", async () => {
        const { hookManager } = await loadFixture(deployContractsFixture);
        expect(await hookManager.getEnabledHook(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should return zero address if hook address is reset to zero address", async () => {
        const { hookManager, hook } = await loadFixture(deployContractsFixture);

        const hookAddress = await hook.getAddress();
        expect(await hookManager.connect(user1).setHook(hookAddress));
        expect(await hookManager.connect(user1).setHook(hre.ethers.ZeroAddress));
        expect(await hookManager.getEnabledHook(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should revert if user attempts to set random address as hook", async () => {
        const { hookManager } = await loadFixture(deployContractsFixture);
        const hookAddress = hre.ethers.getAddress(hre.ethers.hexlify(hre.ethers.randomBytes(20)));
        await expect(hookManager.setHook(hookAddress)).to.be.reverted;
    });

    it("Should revert AddressDoesNotImplementHookInterface if user attempts address does not implement Hook interface", async () => {
        const { hookManager } = await loadFixture(deployContractsFixture);
        const contractNotImplementingHookInterface = await (await hre.ethers.getContractFactory("MockContract")).deploy();
        await contractNotImplementingHookInterface.givenMethodReturnBool("0x01ffc9a7", false);

        await expect(hookManager.setHook((await contractNotImplementingHookInterface).getAddress())).to.be.revertedWithCustomError(
            hookManager,
            "AddressDoesNotImplementHookInterface",
        );
    });
});
