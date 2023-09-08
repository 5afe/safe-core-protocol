import hre, { deployments } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { MaxUint256, ZeroAddress } from "ethers";
import { SENTINEL_MODULES } from "./utils/constants";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { buildRootTx, buildSingleTx } from "./utils/builder";
import { getHooksWithFailingPrechecks, getHooksWithPassingChecks, getHooksWithFailingPostCheck } from "./utils/mockHooksBuilder";
import { ModuleType } from "./utils/constants";
import { getInstance } from "./utils/contracts";
import { MockContract, SafeProtocolManager } from "../typechain-types";
import {
    PLUGIN_PERMISSION_CALL_TO_SELF,
    PLUGIN_PERMISSION_DELEGATE_CALL,
    PLUGIN_PERMISSION_EXECUTE_CALL,
    PLUGIN_PERMISSION_NONE,
} from "../src/utils/constants";

describe("SafeProtocolManager", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

    before(async () => {
        [deployer, owner, user1, user2] = await hre.ethers.getSigners();
    });

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const safeProtocolRegistry = await hre.ethers.deployContract("SafeProtocolRegistry", [owner.address]);
        const safeProtocolManager = await (
            await hre.ethers.getContractFactory("SafeProtocolManager")
        ).deploy(owner.address, await safeProtocolRegistry.getAddress());

        const safe = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target], { signer: deployer });
        return { safeProtocolManager, safeProtocolRegistry, safe };
    });

    describe("Setup manager", async () => {
        it("Should set manager as a plugin for a safe", async () => {
            const { safeProtocolManager } = await setupTests();
            const safe = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target]);
            expect(await safe.setModule(await safeProtocolManager.getAddress()));
        });
    });

    describe("Check for IERC165 support", async () => {
        it("Should return true when supported interfaceId is passed as parameter", async () => {
            const { safeProtocolManager } = await setupTests();
            expect(await safeProtocolManager.supportsInterface.staticCall("0x945b8148")).to.be.true;
            expect(await safeProtocolManager.supportsInterface.staticCall("0xe6d7a83a")).to.be.true;
            expect(await safeProtocolManager.supportsInterface.staticCall("0x01ffc9a7")).to.be.true;
            expect(await safeProtocolManager.supportsInterface.staticCall("0x3f6c68ec")).to.be.true;
        });

        it("Should return false when non-supported interfaceId is passed as parameter", async () => {
            const { safeProtocolManager } = await setupTests();
            expect(await safeProtocolManager.supportsInterface.staticCall("0x00000000")).to.be.false;
            expect(await safeProtocolManager.supportsInterface.staticCall("0x11223344")).to.be.false;
        });
    });

    describe("Plugins", async () => {
        async function deployContractsWithPluginFixture() {
            const { safeProtocolManager, safe, safeProtocolRegistry } = await setupTests();
            const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
            await safeProtocolRegistry.connect(owner).addModule(plugin, ModuleType.Plugin);
            return { safeProtocolManager, safe, plugin, safeProtocolRegistry };
        }

        describe("Test enable plugin", async () => {
            it("Should not allow a Safe to enable zero address plugin", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    hre.ethers.ZeroAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await expect(safe.exec(await safeProtocolManager.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidPluginAddress")
                    .withArgs(hre.ethers.ZeroAddress);
            });

            it("Blocks calls not initiated from Safe", async () => {
                const { safeProtocolManager, plugin, safe } = await loadFixture(deployContractsWithPluginFixture);
                const pluginAddress = await plugin.getAddress();
                await expect(safeProtocolManager.enablePlugin(pluginAddress, PLUGIN_PERMISSION_EXECUTE_CALL))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidSender")
                    .withArgs("0x0000000000000000000000000000000000000001");

                const contract = await getInstance<SafeProtocolManager>("SafeProtocolManager", safe);
                await expect(contract.connect(user1).enablePlugin(pluginAddress, PLUGIN_PERMISSION_EXECUTE_CALL))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidSender")
                    .withArgs(user1.address);
            });

            it("Should not allow a Safe to enable plugin if not added as a module in registry", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());
                const pluginAddress = await (await (await hre.ethers.getContractFactory("TestPlugin")).deploy()).getAddress();

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await expect(safe.exec(await safeProtocolManager.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolManager, "ModuleNotPermitted")
                    .withArgs(pluginAddress, 0, 0);
            });

            it("Should not allow a Safe to enable plugin that does not support ERC165", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());

                const mockPlugin = await hre.ethers.deployContract("MockContract");
                await mockPlugin.givenMethodReturnBool("0x01ffc9a7", true);
                await safeProtocolRegistry.connect(owner).addModule(mockPlugin.target, ModuleType.Plugin);

                await mockPlugin.givenMethodReturnBool("0x01ffc9a7", false);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    mockPlugin.target,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await expect(safe.exec(safe.target, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolManager, "ContractDoesNotImplementValidInterfaceId")
                    .withArgs(mockPlugin.target);
            });

            it("Should not allow a Safe to enable plugin having no code", async () => {
                // This test simulates case when a Plugin is added in registry but later has no code
                // because it calls selfdestruct.

                // Setup mock registry. Required to bypass ERC165 checks for user2.address as it is an EOA.
                const safeProtocolRegistry = await hre.ethers.deployContract("MockContract");
                await safeProtocolRegistry.givenMethodReturnBool("0x01ffc9a7", true);

                const safeProtocolManager = await (
                    await hre.ethers.getContractFactory("SafeProtocolManager")
                ).deploy(owner.address, await safeProtocolRegistry.getAddress());

                const safe = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target], { signer: deployer });
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    user2.address,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);

                await expect(safe.exec(safe.target, 0, data)).to.be.reverted;
            });

            it("Should not allow a Safe to enable plugin if flagged in registry", async () => {
                const { safeProtocolManager, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());
                await safeProtocolRegistry.connect(owner).flagModule(plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await expect(safe.exec(await safeProtocolManager.getAddress(), 0, data)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "ModuleNotPermitted",
                );
            });

            it("Should not allow a Safe to enable SENTINEL_MODULES plugin", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithPluginFixture);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    SENTINEL_MODULES,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await expect(safe.exec(await safeProtocolManager.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should allow a Safe to enable a plugin", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const pluginAddress = await plugin.getAddress();
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);

                // As SafeProtocolManager is a fallback handler on a contract, call to enablePlugin(...) function will be
                // forwarded for SafeProtocolManager. Direct calls to SafeProtocolManager to enable plugin are intentionally blocked.
                await safe.exec(safe.target, 0, data);
                expect(await safeProtocolManager.getPluginInfo(safe.target, pluginAddress)).to.eql([
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                    SENTINEL_MODULES,
                ]);
            });

            it("Should fail to enable a plugin (with non root access) with root access", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());
                const pluginAddress = await plugin.getAddress();

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);

                await expect(safe.exec(safe.target, 0, data)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "PluginPermissionsMismatch",
                );
                expect(await safeProtocolManager.getPluginInfo(await safe.getAddress(), pluginAddress)).to.eql([
                    PLUGIN_PERMISSION_NONE,
                    ZeroAddress,
                ]);
            });
        });

        describe("Test disable plugin", async () => {
            it("Should not allow a Safe to disable zero address plugin", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());
                const data = safeProtocolManager.interface.encodeFunctionData("disablePlugin", [
                    hre.ethers.ZeroAddress,
                    hre.ethers.ZeroAddress,
                ]);
                await expect(safe.exec(await safeProtocolManager.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidPluginAddress")
                    .withArgs(hre.ethers.ZeroAddress);
            });

            it("Blocks calls not initiated from Safe", async () => {
                const { safeProtocolManager, plugin, safe } = await loadFixture(deployContractsWithPluginFixture);
                const pluginAddress = await plugin.getAddress();

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const contract = await getInstance<SafeProtocolManager>("SafeProtocolManager", safe);
                await expect(contract.connect(user1).disablePlugin(SENTINEL_MODULES, pluginAddress))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidSender")
                    .withArgs(user1.address);
            });

            it("Should not allow a Safe to disable SENTINEL_MODULES plugin", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("disablePlugin", [SENTINEL_MODULES, SENTINEL_MODULES]);
                await expect(safe.exec(safeProtocolManagerAddress, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should revert if nexPluginPtr and plugin address do not match", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("disablePlugin", [
                    SENTINEL_MODULES,
                    await plugin.getAddress(),
                ]);
                await expect(safe.exec(safe.target, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidPrevPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should disable a plugin", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                const pluginAddress = await plugin.getAddress();
                const safeAddress = await safe.getAddress();

                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safeAddress, 0, data);
                expect(await safeProtocolManager.getPluginInfo(safeAddress, pluginAddress)).to.eql([
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                    SENTINEL_MODULES,
                ]);

                const data2 = safeProtocolManager.interface.encodeFunctionData("disablePlugin", [SENTINEL_MODULES, pluginAddress]);
                await safe.exec(safeAddress, 0, data2);
                expect(await safeProtocolManager.getPluginInfo(safeAddress, pluginAddress)).to.eql([PLUGIN_PERMISSION_NONE, ZeroAddress]);
            });

            it("Should not allow enabling plugin if already enabled", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                expect(await safeProtocolManager.getPluginInfo(await safe.getAddress(), pluginAddress)).to.eql([
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                    SENTINEL_MODULES,
                ]);

                await expect(safe.exec(safe.target, 0, data)).to.be.revertedWithCustomError(safeProtocolManager, "PluginAlreadyEnabled");
            });
        });

        describe("Get paginated list of plugins", async () => {
            it("Should revert with InvalidPluginAddress", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setModule(safeProtocolManagerAddress);
                await expect(safeProtocolManager.getPluginsPaginated.staticCall(pluginAddress, 1, safe))
                    .to.be.revertedWithCustomError(safeProtocolManager, "InvalidPluginAddress")
                    .withArgs(pluginAddress);
            });

            it("Should revert with InvalidPageSize", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());
                await expect(
                    safeProtocolManager.getPluginsPaginated.staticCall(await plugin.getAddress(), 0, safe),
                ).to.be.revertedWithCustomError(safeProtocolManager, "ZeroPageSizeNotAllowed");
            });

            it("Should return empty list if no plugins are enabled", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setModule(await safeProtocolManager.getAddress());
                expect(await safeProtocolManager.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([[], SENTINEL_MODULES]);
            });

            it("Should return list with one plugin", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);

                const pluginAddress = await plugin.getAddress();

                await safe.setModule(safeProtocolManager.target);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                await safeProtocolManager.getPluginInfo(await safe.getAddress(), pluginAddress);
                expect(await safeProtocolManager.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 2 plugins starting from sentinel address", async () => {
                const { safeProtocolManager, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const plugin2 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const plugin2Address = await plugin2.getAddress();

                await safeProtocolRegistry.connect(owner).addModule(plugin2Address, ModuleType.Plugin);
                const data2 = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    plugin2Address,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data2);

                expect(await safeProtocolManager.getPluginsPaginated.staticCall(SENTINEL_MODULES, 10, safe)).to.eql([
                    [plugin2Address, pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 plugin starting from non-sentinel address", async () => {
                const { safeProtocolManager, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const plugin2 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const plugin2Address = await plugin2.getAddress();
                await safeProtocolRegistry.connect(owner).addModule(plugin2Address, ModuleType.Plugin);
                const data2 = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    plugin2Address,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data2);
                expect(await safeProtocolManager.getPluginsPaginated.staticCall(plugin2Address, 10, safe)).to.eql([
                    [pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 plugin when called with pageSize 1", async () => {
                const { safeProtocolManager, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                const plugin2Address = await (await (await hre.ethers.getContractFactory("TestPlugin")).deploy()).getAddress();

                await safeProtocolRegistry.connect(owner).addModule(plugin2Address, ModuleType.Plugin);
                const data2 = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    plugin2Address,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);

                await safe.exec(safe.target, 0, data2);
                expect(await safeProtocolManager.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [plugin2Address],
                    plugin2Address,
                ]);

                expect(await safeProtocolManager.getPluginsPaginated.staticCall(plugin2Address, 1, safe)).to.eql([
                    [pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return empty list after disabling a only enabled plugin", async () => {
                const { safeProtocolManager, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                const pluginAddress = await plugin.getAddress();
                const safeAddress = await safe.getAddress();

                await safe.setModule(safeProtocolManagerAddress);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                expect(await safeProtocolManager.getPluginInfo(safeAddress, pluginAddress)).to.eql([
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                    SENTINEL_MODULES,
                ]);

                const data2 = safeProtocolManager.interface.encodeFunctionData("disablePlugin", [SENTINEL_MODULES, pluginAddress]);
                await safe.exec(safe.target, 0, data2);
                expect(await safeProtocolManager.getPluginInfo(safeAddress, pluginAddress)).to.eql([PLUGIN_PERMISSION_NONE, ZeroAddress]);
                expect(await safeProtocolManager.isPluginEnabled(safe.target, plugin.target)).to.be.false;

                expect(await safeProtocolManager.getPluginsPaginated(SENTINEL_MODULES, 100, safeAddress)).to.deep.equal([
                    [],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 2 plugins after disabling a 1 out of 3", async () => {
                const { safeProtocolManager, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                await safe.setModule(safeProtocolManagerAddress);

                // enable plugin 1
                const dataEnablePlugin1 = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    plugin.target,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, dataEnablePlugin1);

                // enable plugin 2
                const plugin2 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(plugin2.target, ModuleType.Plugin);
                const dataEnablePlugin2 = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    plugin2.target,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, dataEnablePlugin2);

                // enable plugin 3
                const plugin3 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(plugin3.target, ModuleType.Plugin);
                const dataEnablePlugin3 = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    plugin3.target,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, dataEnablePlugin3);

                // Disable plugin 2
                const data2 = safeProtocolManager.interface.encodeFunctionData("disablePlugin", [plugin3.target, plugin2.target]);
                await safe.exec(safe.target, 0, data2);
                expect(await safeProtocolManager.getPluginInfo(safe.target, plugin2.target)).to.eql([PLUGIN_PERMISSION_NONE, ZeroAddress]);
                expect(await safeProtocolManager.isPluginEnabled(safe.target, plugin2.target)).to.be.false;

                expect(await safeProtocolManager.getPluginsPaginated(SENTINEL_MODULES, 100, safe.target)).to.deep.equal([
                    [plugin3.target, plugin.target],
                    SENTINEL_MODULES,
                ]);
            });
        });
    });

    describe("Execute transaction from plugin", async () => {
        async function deployContractsWithEnabledManagerFixture() {
            const { safeProtocolManager, safeProtocolRegistry, safe } = await setupTests();
            await safe.setModule(await safeProtocolManager.getAddress());
            return { safeProtocolManager, safe, safeProtocolRegistry };
        }

        describe("Plugin with non-root access", async () => {
            it("Should not allow non-enabled plugin to execute tx from a safe", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithEnabledManagerFixture);
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(plugin.executeFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "PluginNotEnabled",
                );
            });

            it("Should process a SafeTransaction and transfer ETH from safe to an EOA", async function () {
                const { safeProtocolManager, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledManagerFixture);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                const safeAddress = await safe.getAddress();
                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: safeAddress,
                        value: amount,
                    })
                ).wait();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                const balanceBefore = await hre.ethers.provider.getBalance(user1.address);
                const tx = await plugin.executeFromPlugin(safeProtocolManager, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolManager, "ActionsExecuted").withArgs(safeAddress, safeTx.metadataHash, 1);
            });

            it("Should revert with MissingPluginPermission when `to` address is account and plugin does not have CALL_TO_SELF permission", async function () {
                const { safeProtocolManager, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledManagerFixture);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                await plugin.setRequiresPermissions(PLUGIN_PERMISSION_CALL_TO_SELF);

                const safeTx = buildSingleTx(safe.target, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(plugin.executeFromPlugin(safeProtocolManager, safe, safeTx))
                    .to.be.revertedWithCustomError(safeProtocolManager, "MissingPluginPermission")
                    .withArgs(
                        plugin.target,
                        PLUGIN_PERMISSION_CALL_TO_SELF,
                        PLUGIN_PERMISSION_CALL_TO_SELF,
                        PLUGIN_PERMISSION_EXECUTE_CALL,
                    );
            });

            it("Should revert with a InvalidToFieldInSafeProtocolAction when `to` address is Manager address", async function () {
                const { safeProtocolManager, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledManagerFixture);
                const safeProtocolManagerAddress = await safeProtocolManager.getAddress();
                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                const safeTx = buildSingleTx(
                    safeProtocolManagerAddress,
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(plugin.executeFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "InvalidToFieldInSafeProtocolAction",
                );
            });

            it("Should process a SafeTransaction with hooks enabled and transfer ETH from safe to an EOA", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                // Enable hooks on a safe
                const hooks = await getHooksWithPassingChecks();
                await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);
                const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [await hooks.getAddress()]);
                await safe.exec(safe.target, 0, dataSetHooks);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                const safeAddress = await safe.getAddress();
                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: safeAddress,
                        value: amount,
                    })
                ).wait();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                const balanceBefore = await hre.ethers.provider.getBalance(user1.address);
                const tx = await plugin.executeFromPlugin(safeProtocolManager, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.equal(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolManager, "ActionsExecuted").withArgs(safeAddress, safeTx.metadataHash, 1);

                // Check whether hooks are called with right parameters
                const mockHooks = await getInstance<MockContract>("MockContract", hooks.target);
                expect(await mockHooks.invocationCount()).to.equal(2);

                // preCheck hooks calls
                expect(await mockHooks.invocationCountForMethod("0x176ae7b7")).to.equal(1);

                const postCheckCallData = hooks.interface.encodeFunctionData("postCheck", [safe.target, true, "0xdeadbeef"]);
                expect(await mockHooks.invocationCountForCalldata(postCheckCallData)).to.equal(1);

                // Check if temporary hooks related storage is cleared after tx
                expect(await safeProtocolManager.tempHooksData.staticCall(safeAddress)).to.deep.equal([ZeroAddress, "0x"]);
            });

            it("Should fail executing a transaction through plugin when hooks pre-check fails", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                // Enable hooks on a safe
                const hooks = await getHooksWithFailingPrechecks();
                await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);

                const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [await hooks.getAddress()]);
                await safe.exec(safe.target, 0, dataSetHooks);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                await expect(plugin.executeFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWith("pre-check failed");
            });

            it("Should fail executing a transaction through plugin when hooks post-check fails", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                // Enable hooks on a safe
                const hooks = await getHooksWithFailingPostCheck();
                await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);

                const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [await hooks.getAddress()]);
                await safe.exec(safe.target, 0, dataSetHooks);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const pluginAddress = await plugin.getAddress();

                await safeProtocolRegistry.connect(owner).addModule(pluginAddress, ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: await safe.getAddress(),
                        value: amount,
                    })
                ).wait();
                await expect(plugin.executeFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWith("post-check failed");
            });

            it("Should revert with ActionExecutionFailed error if Safe doesn't have enough ETH balance", async function () {
                const { safeProtocolManager, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledManagerFixture);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);
                const safeTx = {
                    actions: [
                        {
                            to: user1.address,
                            value: hre.ethers.parseEther("1"),
                            data: "0x",
                        },
                    ],
                    nonce: 1,
                    metadataHash: hre.ethers.randomBytes(32),
                };
                const balanceBefore = await hre.ethers.provider.getBalance(user1.address);

                await expect(plugin.executeFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "ActionExecutionFailed",
                );
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);
                expect(balanceAfter).to.eql(balanceBefore);
            });

            it("Should not process a SafeTransaction if plugin is not permitted", async function () {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: await safe.getAddress(),
                        value: amount,
                    })
                ).wait();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                await safeProtocolRegistry.connect(owner).flagModule(await plugin.getAddress());
                await expect(plugin.executeFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "ModuleNotPermitted",
                );
            });
        });

        describe("Plugin with root access", async () => {
            it("Should execute a transaction from root access enabled plugin", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                const safeAddress = await safe.getAddress();

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: safeAddress,
                        value: amount,
                    })
                ).wait();

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                const balanceBefore = await hre.ethers.provider.getBalance(user1.address);
                const tx = await plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.be.equal(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolManager, "RootAccessActionExecuted").withArgs(safeAddress, safeTx.metadataHash);
            });

            it("Should execute call to executeTransaction(...) from plugin with CALL_TO_SELF permission", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                const safeAddress = await safe.getAddress();

                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await plugin.setRequiresPermissions(PLUGIN_PERMISSION_CALL_TO_SELF);
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                // Enable plugin
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_CALL_TO_SELF,
                ]);
                await safe.exec(safe.target, 0, data);

                const safeTx = buildSingleTx(safeAddress, 0n, "0x", BigInt(1), hre.ethers.randomBytes(32));
                expect(await plugin.executeFromPlugin(safeProtocolManager.target, safeAddress, safeTx))
                    .to.emit(safeProtocolManager, "ActionsExecuted")
                    .withArgs(safeAddress, safeTx.metadataHash, safeTx.nonce);
            });

            it("Should execute a transaction from root access enabled plugin with hooks enabled", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                const safeAddress = await safe.getAddress();

                // Enable hooks on a safe
                const hooks = await getHooksWithPassingChecks();
                await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);

                const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [await hooks.getAddress()]);
                await safe.exec(safe.target, 0, dataSetHooks);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: safeAddress,
                        value: amount,
                    })
                ).wait();

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                const balanceBefore = await hre.ethers.provider.getBalance(user1.address);
                const tx = await plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.be.equal(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolManager, "RootAccessActionExecuted").withArgs(safeAddress, safeTx.metadataHash);

                // Check whether hooks are called with right parameters
                const mockHooks = await getInstance<MockContract>("MockContract", hooks.target);
                expect(await mockHooks.invocationCount()).to.equal(2);

                // preCheckRootAccess hooks calls
                expect(await mockHooks.invocationCountForMethod("0x7359b742")).to.equal(1);

                const postCheckCallData = hooks.interface.encodeFunctionData("postCheck", [safe.target, true, "0xbaddad"]);
                expect(await mockHooks.invocationCountForCalldata(postCheckCallData)).to.equal(1);

                // Check if temporary hooks related storage is cleared after tx
                expect(await safeProtocolManager.tempHooksData.staticCall(safeAddress)).to.deep.equal([ZeroAddress, "0x"]);
            });

            it("Should fail to execute a transaction from root access enabled plugin when hooks pre-check fails", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                // Enable hooks on a safe
                const hooks = await getHooksWithFailingPrechecks();
                await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);

                const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [await hooks.getAddress()]);
                await safe.exec(safe.target, 0, dataSetHooks);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWith(
                    "pre-check root access failed",
                );
            });

            it("Should fail to execute a transaction from root access enabled plugin when hooks post-check fails", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);
                const safeAddress = await safe.getAddress();

                // Enable hooks on a safe
                const hooks = await getHooksWithFailingPostCheck();
                await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);

                const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [await hooks.getAddress()]);
                await safe.exec(safe.target, 0, dataSetHooks);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const pluginAddress = await plugin.getAddress();

                await safeProtocolRegistry.connect(owner).addModule(pluginAddress, ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: safeAddress,
                        value: amount,
                    })
                ).wait();

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWith(
                    "post-check failed",
                );
            });

            it("Should not allow a transaction from root access if plugin is flagged", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);

                const testDelegateCallReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user2.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: await safe.getAddress(),
                        value: amount,
                    })
                ).wait();

                const safeTx = buildRootTx(
                    await testDelegateCallReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await safeProtocolRegistry.connect(owner).flagModule(await plugin.getAddress());
                await expect(plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "ModuleNotPermitted",
                );
            });

            it("Should not allow non-enabled plugin to execute root tx from a safe", async () => {
                const { safeProtocolManager, safe } = await loadFixture(deployContractsWithEnabledManagerFixture);
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const safeTx = buildRootTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "PluginNotEnabled",
                );
            });

            it("Should revert with PluginPermissionsMismatch if plugin indicates it doesn't need root access anymore", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                await plugin.setRequiresPermissions(PLUGIN_PERMISSION_EXECUTE_CALL);
                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx))
                    .to.be.revertedWithCustomError(safeProtocolManager, "MissingPluginPermission")
                    .withArgs(
                        plugin.target,
                        PLUGIN_PERMISSION_EXECUTE_CALL,
                        PLUGIN_PERMISSION_DELEGATE_CALL,
                        PLUGIN_PERMISSION_DELEGATE_CALL,
                    );
            });

            it("Should emit RootAccessActionExecutionFailed when root access action execution fails", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addModule(await plugin.getAddress(), ModuleType.Plugin);

                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    await plugin.getAddress(),
                    PLUGIN_PERMISSION_DELEGATE_CALL,
                ]);
                await safe.exec(safe.target, 0, data);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolManager,
                    "RootAccessActionExecutionFailed",
                );
            });

            it("Should emit MissingPluginPermission when plugin is not granted root access", async () => {
                const { safeProtocolManager, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledManagerFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const pluginAddress = await plugin.getAddress();
                await safeProtocolRegistry.connect(owner).addModule(pluginAddress, ModuleType.Plugin);
                const data = safeProtocolManager.interface.encodeFunctionData("enablePlugin", [
                    pluginAddress,
                    PLUGIN_PERMISSION_EXECUTE_CALL,
                ]);
                // Required to set plugin to indicate that it does not require root access
                await plugin.setRequiresPermissions(PLUGIN_PERMISSION_EXECUTE_CALL);
                await safe.exec(safe.target, 0, data);

                // Set root access flag back to true
                await plugin.setRequiresPermissions(PLUGIN_PERMISSION_DELEGATE_CALL);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(plugin.executeRootAccessTxFromPlugin(safeProtocolManager, safe, safeTx))
                    .to.be.revertedWithCustomError(safeProtocolManager, "MissingPluginPermission")
                    .withArgs(
                        pluginAddress,
                        PLUGIN_PERMISSION_DELEGATE_CALL,
                        PLUGIN_PERMISSION_DELEGATE_CALL,
                        PLUGIN_PERMISSION_EXECUTE_CALL,
                    );
            });
        });
    });

    describe("Test SafeProtocolManager as Guard on a Safe", async () => {
        const setupTests = deployments.createFixture(async ({ deployments }) => {
            await deployments.fixture();
            [deployer, owner, user1] = await hre.ethers.getSigners();
            const safeProtocolRegistry = await hre.ethers.deployContract("SafeProtocolRegistry", [owner.address]);
            const safeProtocolManager = await (
                await hre.ethers.getContractFactory("SafeProtocolManager")
            ).deploy(owner.address, safeProtocolRegistry.target);

            const safe = await hre.ethers.deployContract("TestExecutor", [safeProtocolManager.target], { signer: deployer });

            const hooks = await getHooksWithPassingChecks();
            const hooksWithFailingPreChecks = await getHooksWithFailingPrechecks();
            const hooksWithFailingPostCheck = await getHooksWithFailingPostCheck();

            await safeProtocolRegistry.connect(owner).addModule(hooks.target, ModuleType.Hooks);
            await safeProtocolRegistry.connect(owner).addModule(hooksWithFailingPreChecks.target, ModuleType.Hooks);
            await safeProtocolRegistry.connect(owner).addModule(hooksWithFailingPostCheck.target, ModuleType.Hooks);

            return { safe, safeProtocolManager, hooks, hooksWithFailingPreChecks, hooksWithFailingPostCheck };
        });

        it("Should not revert when no hooks registered on SafeProtocolManager", async () => {
            const { safe, safeProtocolManager } = await setupTests();

            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkTransaction", [
                user2.address,
                0n,
                "0x",
                0, // Call operation
                0,
                0,
                0,
                ZeroAddress,
                ZeroAddress,
                "0x",
                ZeroAddress,
            ]);
            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256));

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);

            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256));
        });

        it("Should not revert when no hooks registered on SafeProtocolManager for module transaction", async () => {
            const { safe, safeProtocolManager } = await setupTests();

            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkModuleTransaction", [
                user2.address,
                0n,
                "0x",
                0, // Call operation
                ZeroAddress,
            ]);
            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256));

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);

            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256));
        });

        it("Should revert because hooks reverted in pre-check", async () => {
            const { safe, safeProtocolManager, hooksWithFailingPreChecks } = await setupTests();
            // Set Hooks contract for the Safe
            const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooksWithFailingPreChecks.target]);
            await safe.executeCallViaMock(safe.target, 0, dataSetHooks, MaxUint256);

            const execChecks = safeProtocolManager.interface.encodeFunctionData("checkTransaction", [
                user2.address,
                1n,
                "0x",
                0, // Call operation
                0,
                0,
                0,
                ZeroAddress,
                ZeroAddress,
                "0x",
                ZeroAddress,
            ]);

            await expect(safe.executeCallViaMock(safeProtocolManager.target, 0, execChecks, MaxUint256)).to.be.revertedWith(
                "pre-check failed",
            );
        });

        it("Should revert because hooks reverted in post-check", async () => {
            const { safe, safeProtocolManager, hooksWithFailingPostCheck } = await setupTests();
            // Set Hooks contract for the Safe
            const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooksWithFailingPostCheck.target]);
            await safe.executeCallViaMock(safe.target, 0, dataSetHooks, MaxUint256);

            // Required to execute pre-checks to set tempHooksAddress[msg.sender]
            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkTransaction", [
                user2.address,
                0n,
                "0x",
                0, // Call operation
                0,
                0,
                0,
                ZeroAddress,
                ZeroAddress,
                "0x",
                ZeroAddress,
            ]);
            await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256);

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);

            await expect(safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256)).to.be.revertedWith(
                "post-check failed",
            );
        });

        it("Should pass hooks checks", async () => {
            const { safe, safeProtocolManager, hooks } = await setupTests();
            // Set Hooks contract for the Safe
            const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooks.target]);
            await safe.executeCallViaMock(safe.target, 0, dataSetHooks, MaxUint256);

            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkTransaction", [
                user2.address,
                0n,
                "0x",
                0, // Call operation
                0,
                0,
                0,
                ZeroAddress,
                ZeroAddress,
                "0x",
                ZeroAddress,
            ]);
            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256));

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);

            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256));

            // Check if temporary hooks related storage is cleared after tx
            expect(await safeProtocolManager.tempHooksData.staticCall(safe.target)).to.deep.equal([ZeroAddress, "0x"]);

            const mockHooks = await getInstance<MockContract>("MockContract", hooks.target);
            // Pre-check hooks calls
            expect(await mockHooks.invocationCountForMethod("0x176ae7b7")).to.equal(1);
            const postCheckCallData = hooks.interface.encodeFunctionData("postCheck", [safe.target, true, "0xdeadbeef"]);
            expect(await mockHooks.invocationCountForCalldata(postCheckCallData)).to.equal(1);
        });

        it("Should pass hooks checks for module transaction with call operation", async () => {
            const { safe, safeProtocolManager, hooks } = await setupTests();
            // Set Hooks contract for the Safe
            const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooks.target]);
            await safe.executeCallViaMock(safe.target, 0, dataSetHooks, MaxUint256);

            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkModuleTransaction", [
                user2.address,
                0n,
                "0x",
                0, // Call operation
                ZeroAddress,
            ]);

            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256));

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);
            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256));

            // Check if temporary hooks related storage is cleared after tx
            expect(await safeProtocolManager.tempHooksData.staticCall(safe.target)).to.deep.equal([ZeroAddress, "0x"]);

            const mockHooks = await getInstance<MockContract>("MockContract", hooks.target);
            // preCheck hooks calls
            const safeTx = buildSingleTx(user2.address, 0n, "0x", 0n, hre.ethers.ZeroHash);
            const preCheckCalldata = hooks.interface.encodeFunctionData("preCheck", [
                safe.target,
                safeTx,
                1,
                hre.ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ZeroAddress]),
            ]);
            expect(await mockHooks.invocationCountForMethod("0x176ae7b7")).to.equal(1);
            expect(await mockHooks.invocationCountForCalldata(preCheckCalldata)).to.equal(1);
            const postCheckCallData = hooks.interface.encodeFunctionData("postCheck", [safe.target, true, "0x"]);

            expect(await mockHooks.invocationCountForCalldata(postCheckCallData)).to.equal(1);
        });

        it("Should pass hooks checks for module transaction with delegateCall operation", async () => {
            const { safe, safeProtocolManager, hooks } = await setupTests();
            // Set Hooks contract for the Safe
            const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooks.target]);
            await safe.executeCallViaMock(safe.target, 0, dataSetHooks, MaxUint256);

            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkModuleTransaction", [
                user2.address,
                0n,
                "0x",
                1, // DelegateCall operation
                ZeroAddress,
            ]);

            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256));

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);

            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256));

            const mockHooks = await getInstance<MockContract>("MockContract", hooks.target);
            // preCheck hooks calls
            const safeTx = buildRootTx(user2.address, 0n, "0x", 0n, hre.ethers.ZeroHash);
            const preCheckCalldata = hooks.interface.encodeFunctionData("preCheckRootAccess", [
                safe.target,
                safeTx,
                1,
                hre.ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ZeroAddress]),
            ]);
            // 0x7359b742 -> preCheckRootAccess function signature
            expect(await mockHooks.invocationCountForMethod("0x7359b742")).to.equal(1);
            expect(await mockHooks.invocationCountForCalldata(preCheckCalldata)).to.equal(1);
            const postCheckCallData = hooks.interface.encodeFunctionData("postCheck", [safe.target, true, "0x"]);

            expect(await mockHooks.invocationCountForCalldata(postCheckCallData)).to.equal(1);
        });

        it("Should pass hooks checks for delegateCall operation", async () => {
            const { safe, safeProtocolManager, hooks } = await setupTests();
            // Set Hooks contract for the Safe
            const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooks.target]);
            await safe.executeCallViaMock(safe.target, 0, dataSetHooks, MaxUint256);

            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkTransaction", [
                user2.address,
                0n,
                "0x",
                1, // DelegateCall operation
                0,
                0,
                0,
                ZeroAddress,
                ZeroAddress,
                "0x",
                ZeroAddress,
            ]);
            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256));

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);

            expect(await safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256));

            const mockHooks = await getInstance<MockContract>("MockContract", hooks.target);
            // preCheckRootAccess hooks calls
            expect(await mockHooks.invocationCountForMethod("0x7359b742")).to.equal(1);
            const postCheckCallData = hooks.interface.encodeFunctionData("postCheck", [safe.target, true, "0xbaddad"]);
            expect(await mockHooks.invocationCountForCalldata(postCheckCallData)).to.equal(1);
        });

        it("uses old hooks in checkAfterExecution if hooks get updated in between transactions", async () => {
            // In below flow: pre-check of hooksWithFailingPostCheck is executed, and post-check of
            // hooksWithFailingPostCheck hooks is executed even though hooks get updated in between tx.
            const { safe, safeProtocolManager, hooksWithFailingPostCheck, hooks } = await setupTests();
            // Set Hooks contract for the Safe
            const dataSetHooks = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooksWithFailingPostCheck.target]);
            await safe.executeCallViaMock(safe.target, 0, dataSetHooks, MaxUint256);

            // Required to execute pre-checks to set tempHooksAddress[msg.sender]
            const execPreChecks = safeProtocolManager.interface.encodeFunctionData("checkTransaction", [
                user2.address,
                0n,
                "0x",
                0, // Call operation
                0,
                0,
                0,
                ZeroAddress,
                ZeroAddress,
                "0x",
                ZeroAddress,
            ]);
            await safe.executeCallViaMock(safeProtocolManager.target, 0, execPreChecks, MaxUint256);

            const txData = safeProtocolManager.interface.encodeFunctionData("setHooks", [hooks.target]);
            await safe.executeCallViaMock(safe.target, 0, txData, MaxUint256);

            const execPostChecks = safeProtocolManager.interface.encodeFunctionData("checkAfterExecution", [
                hre.ethers.randomBytes(32),
                true,
            ]);

            await expect(safe.executeCallViaMock(safeProtocolManager.target, 0, execPostChecks, MaxUint256)).to.be.revertedWith(
                "post-check failed",
            );
        });
    });
});
