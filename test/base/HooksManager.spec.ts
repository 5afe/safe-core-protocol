import hre, { deployments } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { getHooksWithPassingChecks } from "../utils/mockHooksBuilder";
import { ZeroAddress } from "ethers";
import { ModuleType } from "../utils/constants";

describe("HooksManager", async () => {
    let deployer: SignerWithAddress, user1: SignerWithAddress, owner: SignerWithAddress;

    before(async () => {
        [deployer, owner, user1] = await hre.ethers.getSigners();
    });

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        [deployer, user1] = await hre.ethers.getSigners();
        const safeProtocolRegistry = await hre.ethers.deployContract("SafeProtocolRegistry", [owner.address]);
        const hooksManager = await (
            await hre.ethers.getContractFactory("SafeProtocolManager")
        ).deploy(owner.address, await safeProtocolRegistry.getAddress());

        const account = await hre.ethers.deployContract("TestExecutor", [hooksManager.target], { signer: deployer });
        const hooks = await getHooksWithPassingChecks();
        await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);

        return { hooksManager, hooks, account, safeProtocolRegistry };
    });

    it("Should emit HooksChanged event when hooks are enabled", async () => {
        const { hooksManager, hooks, account } = await setupTests();

        const calldata = hooksManager.interface.encodeFunctionData("setHooks", [hooks.target]);

        expect(await account.exec(account.target, 0n, calldata))
            .to.emit(hooksManager, "HooksChanged")
            .withArgs(account.target, hooks.target);
    });

    it("Should return correct hooks address", async () => {
        const { hooksManager, hooks, account } = await setupTests();
        const calldata = hooksManager.interface.encodeFunctionData("setHooks", [hooks.target]);
        await account.exec(account.target, 0n, calldata);
        expect(await hooksManager.getEnabledHooks(account.target)).to.be.equal(hooks.target);
    });

    it("Should return zero address if hooks are not enabled", async () => {
        const { hooksManager } = await setupTests();
        expect(await hooksManager.getEnabledHooks(user1.address)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should return zero address if hooks address is reset to zero address", async () => {
        const { hooksManager, hooks, account } = await setupTests();

        const calldata = hooksManager.interface.encodeFunctionData("setHooks", [hooks.target]);
        await account.exec(account.target, 0n, calldata);

        const calldata2 = hooksManager.interface.encodeFunctionData("setHooks", [ZeroAddress]);
        await account.exec(account.target, 0n, calldata2);

        expect(await hooksManager.getEnabledHooks(account.target)).to.be.equal(hre.ethers.ZeroAddress);
    });

    it("Should revert if user attempts to set random address as hooks", async () => {
        const { hooksManager } = await setupTests();
        const hooksAddress = hre.ethers.getAddress(hre.ethers.hexlify(hre.ethers.randomBytes(20)));
        await expect(hooksManager.setHooks(hooksAddress)).to.be.reverted;
    });

    it("Should revert ContractDoesNotImplementValidInterfaceId if user attempts address does not implement Hooks interface", async () => {
        const { hooksManager, account, safeProtocolRegistry } = await setupTests();
        const contractNotImplementingHooksInterface = await (await hre.ethers.getContractFactory("MockContract")).deploy();
        await contractNotImplementingHooksInterface.givenMethodReturnBool("0x01ffc9a7", true);
        await safeProtocolRegistry.connect(owner).addModule(contractNotImplementingHooksInterface.target, ModuleType.Hooks);

        await contractNotImplementingHooksInterface.givenMethodReturnBool("0x01ffc9a7", false);
        const calldata = hooksManager.interface.encodeFunctionData("setHooks", [contractNotImplementingHooksInterface.target]);
        await expect(account.exec(account.target, 0n, calldata)).to.be.revertedWithCustomError(
            hooksManager,
            "ContractDoesNotImplementValidInterfaceId",
        );
    });
});
