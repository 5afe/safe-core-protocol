import hre, { deployments } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { getHooksWithPassingChecks } from "../utils/mockHooksBuilder";
import { IntegrationType } from "../utils/constants";

describe("HooksManager", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress, user1: SignerWithAddress;

    before(async () => {
        [deployer, owner, user1] = await hre.ethers.getSigners();
    });

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        [deployer, owner, user1] = await hre.ethers.getSigners();
        const safeProtocolRegistry = await hre.ethers.deployContract("SafeProtocolRegistry", [owner.address]);

        // HooksManager is abstract so using SafeProtocolManager instance
        const hooksManager = await hre.ethers.deployContract("SafeProtocolManager", [owner.address, safeProtocolRegistry.target], {
            signer: deployer,
        });
        const hooks = await getHooksWithPassingChecks();
        await safeProtocolRegistry.connect(owner).addIntegration(hooks.target, IntegrationType.Hooks);
        return { hooksManager, hooks, safeProtocolRegistry };
    });

    it("Should emit HooksChanged event when hooks are enabled", async () => {
        const { hooksManager, hooks } = await setupTests();
        const hooksAddress = await hooks.getAddress();
        expect(await hooksManager.connect(user1).setHooks(hooksAddress))
            .to.emit(hooksManager, "HooksChanged")
            .withArgs(user1, hooksAddress);
    });

    it("Should return correct hooks address", async () => {
        const { hooksManager, hooks } = await setupTests();
        const hooksAddress = await hooks.getAddress();
        await hooksManager.connect(user1).setHooks(hooksAddress);
        expect(await hooksManager.getEnabledHooks(user1.address)).to.be.equal(hooksAddress);
    });

    it("Should return zero address if hooks are not enabled", async () => {
        const { hooksManager } = await setupTests();
        expect(await hooksManager.getEnabledHooks(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should return zero address if hooks address is reset to zero address", async () => {
        const { hooksManager, hooks } = await setupTests();

        const hooksAddress = await hooks.getAddress();
        expect(await hooksManager.connect(user1).setHooks(hooksAddress));
        expect(await hooksManager.connect(user1).setHooks(hre.ethers.ZeroAddress));
        expect(await hooksManager.getEnabledHooks(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should revert if user attempts to set random address as hooks", async () => {
        const { hooksManager } = await setupTests();
        const hooksAddress = hre.ethers.getAddress(hre.ethers.hexlify(hre.ethers.randomBytes(20)));
        await expect(hooksManager.setHooks(hooksAddress)).to.be.reverted;
    });
});
