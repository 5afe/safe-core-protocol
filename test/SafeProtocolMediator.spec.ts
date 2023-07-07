import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { SENTINEL_MODULES } from "./utils/constants";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { buildRootTx, buildSingleTx } from "./utils/builder";
import { getHookWithFailingPrechecks, getHookWithPassingChecks, getHookWithFailingPostCheck } from "./utils/mockHookBuilder";

describe("SafeProtocolMediator", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

    before(async () => {
        [deployer, owner, user1] = await hre.ethers.getSigners();
    });

    async function deployContractsFixture() {
        [deployer, owner, user1, user2] = await hre.ethers.getSigners();
        const safeProtocolRegistry = await hre.ethers.deployContract("SafeProtocolRegistry", [owner.address]);
        const safe = await hre.ethers.deployContract("TestExecutor");
        const safeProtocolMediator = await (
            await hre.ethers.getContractFactory("SafeProtocolMediator")
        ).deploy(owner.address, await safeProtocolRegistry.getAddress());

        return { safeProtocolMediator, safeProtocolRegistry, safe };
    }

    describe("Setup mediator", async () => {
        it("Should set mediator as a plugin for a safe", async () => {
            const safe = await hre.ethers.deployContract("TestExecutor");
            const { safeProtocolMediator } = await loadFixture(deployContractsFixture);
            expect(await safe.setPlugin(await safeProtocolMediator.getAddress()));
        });
    });

    describe("Plugins", async () => {
        async function deployContractsWithPluginFixture() {
            const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsFixture);
            const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
            await safeProtocolRegistry.connect(owner).addComponent(plugin);
            return { safeProtocolMediator, safe, plugin, safeProtocolRegistry };
        }

        describe("Test enable plugin", async () => {
            it("Should not allow a Safe to enable zero address plugin", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [hre.ethers.ZeroAddress, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(hre.ethers.ZeroAddress);
            });

            it("Should not allow a Safe to enable plugin if not added as a component in registry", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                const pluginAddress = await (await (await hre.ethers.getContractFactory("TestPlugin")).deploy()).getAddress();

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "PluginNotPermitted")
                    .withArgs(pluginAddress, 0, 0);
            });

            it("Should not allow a Safe to enable plugin if flagged in registry", async () => {
                const { safeProtocolMediator, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                await safeProtocolRegistry.connect(owner).flagComponent(plugin);

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginNotPermitted",
                );
            });

            it("Should not allow a Safe to enable SENTINEL_MODULES plugin", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [SENTINEL_MODULES, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should allow a Safe to enable a plugin through a mediator", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const pluginAddress = await plugin.getAddress();
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
                expect(await safeProtocolMediator.getPluginInfo(await safe.getAddress(), pluginAddress)).to.eql([false, SENTINEL_MODULES]);
            });

            it("Should fail to enable a plugin (with non root access) with root access", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                const pluginAddress = await plugin.getAddress();

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, true]);

                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginAccessMismatch",
                );
                expect(await safeProtocolMediator.getPluginInfo(await safe.getAddress(), pluginAddress)).to.eql([false, ZeroAddress]);
            });
        });

        describe("Test disable plugin", async () => {
            it("Should not allow a Safe to disable zero address plugin", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                const data = safeProtocolMediator.interface.encodeFunctionData("disablePlugin", [
                    hre.ethers.ZeroAddress,
                    hre.ethers.ZeroAddress,
                ]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(hre.ethers.ZeroAddress);
            });

            it("Should not allow a Safe to disable SENTINEL_MODULES plugin", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("disablePlugin", [SENTINEL_MODULES, SENTINEL_MODULES]);
                await expect(safe.exec(safeProtocolMediatorAddress, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should revert if nexPluginPtr and plugin address do not match", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("disablePlugin", [
                    SENTINEL_MODULES,
                    await plugin.getAddress(),
                ]);
                await expect(safe.exec(safeProtocolMediatorAddress, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPrevPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should disable a plugin", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const pluginAddress = await plugin.getAddress();
                const safeAddress = await safe.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                expect(await safeProtocolMediator.getPluginInfo(safeAddress, pluginAddress)).to.eql([false, SENTINEL_MODULES]);

                const data2 = safeProtocolMediator.interface.encodeFunctionData("disablePlugin", [SENTINEL_MODULES, pluginAddress]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);
                expect(await safeProtocolMediator.getPluginInfo(safeAddress, pluginAddress)).to.eql([false, ZeroAddress]);
            });

            it("Should not allow enabling plugin if already enabled", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                expect(await safeProtocolMediator.getPluginInfo(await safe.getAddress(), pluginAddress)).to.eql([false, SENTINEL_MODULES]);

                await expect(safe.exec(safeProtocolMediatorAddress, 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginAlreadyEnabled",
                );
            });
        });

        describe("Get paginated list of plugins", async () => {
            it("Should revert with InvalidPluginAddress", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                await expect(safeProtocolMediator.getPluginsPaginated.staticCall(pluginAddress, 1, safe))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(pluginAddress);
            });

            it("Should revert with InvalidPageSize", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                await expect(
                    safeProtocolMediator.getPluginsPaginated.staticCall(await plugin.getAddress(), 0, safe),
                ).to.be.revertedWithCustomError(safeProtocolMediator, "ZeroPageSizeNotAllowed");
            });

            it("Should return empty list if no plugins are enabled", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([[], SENTINEL_MODULES]);
            });

            it("Should return list with one plugin", async () => {
                const { safeProtocolMediator, safe, plugin } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                await safeProtocolMediator.getPluginInfo(await safe.getAddress(), pluginAddress);
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 2 plugins starting from sentinel address", async () => {
                const { safeProtocolMediator, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const plugin2 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const plugin2Address = await plugin2.getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(plugin2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [plugin2Address, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);

                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 10, safe)).to.eql([
                    [plugin2Address, pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 plugin starting from non-sentinel address", async () => {
                const { safeProtocolMediator, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const plugin2 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const plugin2Address = await plugin2.getAddress();
                await safeProtocolRegistry.connect(owner).addComponent(plugin2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [plugin2Address, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(plugin2Address, 10, safe)).to.eql([
                    [pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 plugin when called with pageSize 1", async () => {
                const { safeProtocolMediator, safe, plugin, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const pluginAddress = await plugin.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                const plugin2Address = await (await (await hre.ethers.getContractFactory("TestPlugin")).deploy()).getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(plugin2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [plugin2Address, false]);

                await safe.exec(await safeProtocolMediator.getAddress(), 0, data2);
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [plugin2Address],
                    plugin2Address,
                ]);

                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(plugin2Address, 1, safe)).to.eql([
                    [pluginAddress],
                    SENTINEL_MODULES,
                ]);
            });
        });
    });

    describe("Execute transaction from plugin", async () => {
        async function deployContractsWithEnabledMediatorFixture() {
            const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsFixture);
            await safe.setPlugin(await safeProtocolMediator.getAddress());
            return { safeProtocolMediator, safe, safeProtocolRegistry };
        }

        describe("Plugin with non-root access", async () => {
            it("Should not allow non-enabled plugin to execute tx from a safe", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "MoudleNotEnabled",
                );
            });

            it("Should process a SafeTransaction and transfer ETH from safe to an EOA", async function () {
                const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
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
                const tx = await plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "ActionsExecuted").withArgs(safeAddress, safeTx.metaHash, 1);
            });

            it("Should process a SafeTransaction and transfer ETH from safe to an EOA hook enabled", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                // Enable hook on a safe
                const hook = await getHookWithPassingChecks();
                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, dataSetHook);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
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
                const tx = await plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "ActionsExecuted").withArgs(safeAddress, safeTx.metaHash, 1);
            });

            it("Should fail executing a transaction through plugin when hook pre-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                // Enable hook on a safe
                const hook = await getHookWithFailingPrechecks();

                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, dataSetHook);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith("pre-check failed");
            });

            it("Should fail executing a transaction through plugin when hook post-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                // Enable hook on a safe
                const hook = await getHookWithFailingPostCheck();

                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(safeProtocolMediatorAddress, 0, dataSetHook);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const pluginAddress = await plugin.getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(pluginAddress);

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: await safe.getAddress(),
                        value: amount,
                    })
                ).wait();
                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith("post-check failed");
            });

            it("Should revert with ActionExecutionFailed error if Safe doesn't have enough ETH balance", async function () {
                const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
                const safeTx = {
                    actions: [
                        {
                            to: user1.address,
                            value: hre.ethers.parseEther("1"),
                            data: "0x",
                        },
                    ],
                    nonce: 1,
                    metaHash: hre.ethers.randomBytes(32),
                };
                const balanceBefore = await hre.ethers.provider.getBalance(user1.address);

                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ActionExecutionFailed",
                );
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);
                expect(balanceAfter).to.eql(balanceBefore);
            });

            it("Should not process a SafeTransaction if plugin is not permitted", async function () {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: await safe.getAddress(),
                        value: amount,
                    })
                ).wait();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                await safeProtocolRegistry.connect(owner).flagComponent(await plugin.getAddress());
                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginNotPermitted",
                );
            });
        });

        describe("Plugin with root access", async () => {
            it("Should run a transaction from root access enabled plugin", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeAddress = await safe.getAddress();

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

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
                const tx = await plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "RootAccessActionExecuted").withArgs(safeAddress, safeTx.metaHash);
            });

            it("Should execute a transaction from root access enabled plugin with hook enabled", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeAddress = await safe.getAddress();
                // Enable hook on a safe
                const hook = await getHookWithPassingChecks();
                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, dataSetHook);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

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
                const tx = await plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "RootAccessActionExecuted").withArgs(safeAddress, safeTx.metaHash);
            });

            it("Should fail to execute a transaction from root access enabled plugin when hook pre-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                // Enable hook on a safe
                const hook = await getHookWithFailingPrechecks();

                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, dataSetHook);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith(
                    "pre-check root access failed",
                );
            });

            it("Should fail to execute a transaction from root access enabled plugin when hook post-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeAddress = await safe.getAddress();
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();

                // Enable hook on a safe
                const hook = await getHookWithFailingPostCheck();
                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(safeProtocolMediatorAddress, 0, dataSetHook);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const pluginAddress = await plugin.getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(pluginAddress);

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, true]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

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

                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith("post-check failed");
            });

            it("Should not allow a transaction from root access if plugin is flagged", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testDelegateCallReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user2.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

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

                await safeProtocolRegistry.connect(owner).flagComponent(await plugin.getAddress());
                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginNotPermitted",
                );
            });

            it("Should not allow non-enabled plugin to execute root tx from a safe", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const safeTx = buildRootTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "MoudleNotEnabled",
                );
            });

            it("Should revert with PluginRequiresRootAccess if plugin indicates it doesn't need root access anymore", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                await plugin.setRequiresRootAccess(false);
                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginRequiresRootAccess",
                );
            });

            it("Should emit RootAccessActionExecutionFailed when root access action execution fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await plugin.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await plugin.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "RootAccessActionExecutionFailed",
                );
            });

            it("Should emit PluginRequiresRootAccess for root access plugin", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable plugin
                const plugin = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const pluginAddress = await plugin.getAddress();
                await safeProtocolRegistry.connect(owner).addComponent(pluginAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [pluginAddress, false]);
                // Required to set plugin to indicate that it does not require root access
                await plugin.setRequiresRootAccess(false);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                // Set root access flag back to true
                await plugin.setRequiresRootAccess(true);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(plugin.executeFromPlugin(safeProtocolMediator, safe, safeTx))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "PluginRequiresRootAccess")
                    .withArgs(pluginAddress);
            });
        });
    });
});
