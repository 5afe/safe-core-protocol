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
        it("Should set mediator as a module for a safe", async () => {
            const safe = await hre.ethers.deployContract("TestExecutor");
            const { safeProtocolMediator } = await loadFixture(deployContractsFixture);
            expect(await safe.setPlugin(await safeProtocolMediator.getAddress()));
        });
    });

    describe("Plugins", async () => {
        async function deployContractsWithPluginFixture() {
            const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsFixture);
            const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
            await safeProtocolRegistry.connect(owner).addComponent(module);
            return { safeProtocolMediator, safe, module, safeProtocolRegistry };
        }

        describe("Test enable module", async () => {
            it("Should not allow a Safe to enable zero address module", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [hre.ethers.ZeroAddress, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(hre.ethers.ZeroAddress);
            });

            it("Should not allow a Safe to enable module if not added as a component in registry", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                const moduleAddress = await (await (await hre.ethers.getContractFactory("TestPlugin")).deploy()).getAddress();

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "PluginNotPermitted")
                    .withArgs(moduleAddress, 0, 0);
            });

            it("Should not allow a Safe to enable module if flagged in registry", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                await safeProtocolRegistry.connect(owner).flagComponent(module);

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginNotPermitted",
                );
            });

            it("Should not allow a Safe to enable SENTINEL_MODULES module", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [SENTINEL_MODULES, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should allow a Safe to enable a module through a mediator", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);
                const moduleAddress = await module.getAddress();
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
                expect(await safeProtocolMediator.getPluginInfo(await safe.getAddress(), moduleAddress)).to.eql([false, SENTINEL_MODULES]);
            });

            it("Should fail to enable a module (with non root access) with root access", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                const moduleAddress = await module.getAddress();

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, true]);

                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginAccessMismatch",
                );
                expect(await safeProtocolMediator.getPluginInfo(await safe.getAddress(), moduleAddress)).to.eql([false, ZeroAddress]);
            });
        });

        describe("Test disable module", async () => {
            it("Should not allow a Safe to disable zero address module", async () => {
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

            it("Should not allow a Safe to disable SENTINEL_MODULES module", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("disablePlugin", [SENTINEL_MODULES, SENTINEL_MODULES]);
                await expect(safe.exec(safeProtocolMediatorAddress, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should revert if nexPluginPtr and module address do not match", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("disablePlugin", [
                    SENTINEL_MODULES,
                    await module.getAddress(),
                ]);
                await expect(safe.exec(safeProtocolMediatorAddress, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPrevPluginAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should disable a module", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();
                const safeAddress = await safe.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                expect(await safeProtocolMediator.getPluginInfo(safeAddress, moduleAddress)).to.eql([false, SENTINEL_MODULES]);

                const data2 = safeProtocolMediator.interface.encodeFunctionData("disablePlugin", [SENTINEL_MODULES, moduleAddress]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);
                expect(await safeProtocolMediator.getPluginInfo(safeAddress, moduleAddress)).to.eql([false, ZeroAddress]);
            });

            it("Should not allow enabling module if already enabled", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                expect(await safeProtocolMediator.getPluginInfo(await safe.getAddress(), moduleAddress)).to.eql([false, SENTINEL_MODULES]);

                await expect(safe.exec(safeProtocolMediatorAddress, 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginAlreadyEnabled",
                );
            });
        });

        describe("Get paginated list of modules", async () => {
            it("Should revert with InvalidPluginAddress", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                await expect(safeProtocolMediator.getPluginsPaginated.staticCall(moduleAddress, 1, safe))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPluginAddress")
                    .withArgs(moduleAddress);
            });

            it("Should revert with InvalidPageSize", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                await expect(
                    safeProtocolMediator.getPluginsPaginated.staticCall(await module.getAddress(), 0, safe),
                ).to.be.revertedWithCustomError(safeProtocolMediator, "ZeroPageSizeNotAllowed");
            });

            it("Should return empty list if no modules are enabled", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithPluginFixture);
                await safe.setPlugin(await safeProtocolMediator.getAddress());
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([[], SENTINEL_MODULES]);
            });

            it("Should return list with one module", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                await safeProtocolMediator.getPluginInfo(await safe.getAddress(), moduleAddress);
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 2 modules starting from sentinel address", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const module2 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const module2Address = await module2.getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(module2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [module2Address, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);

                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 10, safe)).to.eql([
                    [module2Address, moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 module starting from non-sentinel address", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const module2 = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const module2Address = await module2.getAddress();
                await safeProtocolRegistry.connect(owner).addComponent(module2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [module2Address, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(module2Address, 10, safe)).to.eql([
                    [moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 module when called with pageSize 1", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithPluginFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setPlugin(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                const module2Address = await (await (await hre.ethers.getContractFactory("TestPlugin")).deploy()).getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(module2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [module2Address, false]);

                await safe.exec(await safeProtocolMediator.getAddress(), 0, data2);
                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [module2Address],
                    module2Address,
                ]);

                expect(await safeProtocolMediator.getPluginsPaginated.staticCall(module2Address, 1, safe)).to.eql([
                    [moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });
        });
    });

    describe("Execute transaction from module", async () => {
        async function deployContractsWithEnabledMediatorFixture() {
            const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsFixture);
            await safe.setPlugin(await safeProtocolMediator.getAddress());
            return { safeProtocolMediator, safe, safeProtocolRegistry };
        }

        describe("Plugin with non-root access", async () => {
            it("Should not allow non-enabled module to execute tx from a safe", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "MoudleNotEnabled",
                );
            });

            it("Should process a SafeTransaction and transfer ETH from safe to an EOA", async function () {
                const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), false]);
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
                const tx = await module.executeFromPlugin(safeProtocolMediator, safe, safeTx);
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

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), false]);
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
                const tx = await module.executeFromPlugin(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "ActionsExecuted").withArgs(safeAddress, safeTx.metaHash, 1);
            });

            it("Should fail executing a transaction through module when hook pre-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                // Enable hook on a safe
                const hook = await getHookWithFailingPrechecks();

                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, dataSetHook);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith("pre-check failed");
            });

            it("Should fail executing a transaction through module when hook post-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                // Enable hook on a safe
                const hook = await getHookWithFailingPostCheck();

                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(safeProtocolMediatorAddress, 0, dataSetHook);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                const moduleAddress = await module.getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(moduleAddress);

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: await safe.getAddress(),
                        value: amount,
                    })
                ).wait();
                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith("post-check failed");
            });

            it("Should revert with ActionExecutionFailed error if Safe doesn't have enough ETH balance", async function () {
                const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), false]);
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

                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ActionExecutionFailed",
                );
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);
                expect(balanceAfter).to.eql(balanceBefore);
            });

            it("Should not process a SafeTransaction if module is not permitted", async function () {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPlugin")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const amount = hre.ethers.parseEther("1");
                await (
                    await deployer.sendTransaction({
                        to: await safe.getAddress(),
                        value: amount,
                    })
                ).wait();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));

                await safeProtocolRegistry.connect(owner).flagComponent(await module.getAddress());
                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginNotPermitted",
                );
            });
        });

        describe("Plugin with root access", async () => {
            it("Should run a transaction from root access enabled module", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeAddress = await safe.getAddress();

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), true]);
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
                const tx = await module.executeFromPlugin(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "RootAccessActionExecuted").withArgs(safeAddress, safeTx.metaHash);
            });

            it("Should execute a transaction from root access enabled module with hook enabled", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeAddress = await safe.getAddress();
                // Enable hook on a safe
                const hook = await getHookWithPassingChecks();
                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, dataSetHook);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), true]);
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
                const tx = await module.executeFromPlugin(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "RootAccessActionExecuted").withArgs(safeAddress, safeTx.metaHash);
            });

            it("Should fail to execute a transaction from root access enabled module when hook pre-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                // Enable hook on a safe
                const hook = await getHookWithFailingPrechecks();

                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, dataSetHook);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith(
                    "pre-check root access failed",
                );
            });

            it("Should fail to execute a transaction from root access enabled module when hook post-check fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeAddress = await safe.getAddress();
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();

                // Enable hook on a safe
                const hook = await getHookWithFailingPostCheck();
                const dataSetHook = safeProtocolMediator.interface.encodeFunctionData("setHook", [await hook.getAddress()]);
                await safe.exec(safeProtocolMediatorAddress, 0, dataSetHook);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const moduleAddress = await module.getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(moduleAddress);

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, true]);
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

                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWith("post-check failed");
            });

            it("Should not allow a transaction from root access if module is flagged", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testDelegateCallReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user2.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), true]);
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

                await safeProtocolRegistry.connect(owner).flagComponent(await module.getAddress());
                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginNotPermitted",
                );
            });

            it("Should not allow non-enabled module to execute root tx from a safe", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const safeTx = buildRootTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "MoudleNotEnabled",
                );
            });

            it("Should revert with PluginRequiresRootAccess if module indicates it doesn't need root access anymore", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                await module.setRequiresRootAccess(false);
                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "PluginRequiresRootAccess",
                );
            });

            it("Should emit RootAccessActionExecutionFailed when root access action execution fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "RootAccessActionExecutionFailed",
                );
            });

            it("Should emit PluginRequiresRootAccess for root access module", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestPluginWithRootAccess")).deploy();
                const moduleAddress = await module.getAddress();
                await safeProtocolRegistry.connect(owner).addComponent(moduleAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enablePlugin", [moduleAddress, false]);
                // Required to set module to indicate that it does not require root access
                await module.setRequiresRootAccess(false);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                // Set root access flag back to true
                await module.setRequiresRootAccess(true);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(module.executeFromPlugin(safeProtocolMediator, safe, safeTx))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "PluginRequiresRootAccess")
                    .withArgs(moduleAddress);
            });
        });
    });
});
