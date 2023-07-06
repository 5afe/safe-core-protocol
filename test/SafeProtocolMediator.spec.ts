import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { SENTINEL_MODULES } from "./utils/constants";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { buildRootTx, buildSingleTx } from "./utils/builder";

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
            expect(await safe.setModule(await safeProtocolMediator.getAddress()));
        });
    });

    describe("Modules", async () => {
        async function deployContractsWithModuleFixture() {
            const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsFixture);
            const module = await (await hre.ethers.getContractFactory("TestModule")).deploy();
            await safeProtocolRegistry.connect(owner).addComponent(module);
            return { safeProtocolMediator, safe, module, safeProtocolRegistry };
        }

        describe("Test enable module", async () => {
            it("Should not allow a Safe to enable zero address module", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithModuleFixture);
                await safe.setModule(await safeProtocolMediator.getAddress());
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [hre.ethers.ZeroAddress, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidModuleAddress")
                    .withArgs(hre.ethers.ZeroAddress);
            });

            it("Should not allow a Safe to enable module if not added as a component in registry", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithModuleFixture);
                await safe.setModule(await safeProtocolMediator.getAddress());
                const moduleAddress = await (await (await hre.ethers.getContractFactory("TestModule")).deploy()).getAddress();

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "ModuleNotPermitted")
                    .withArgs(moduleAddress, 0, 0);
            });

            it("Should not allow a Safe to enable module if flagged in registry", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithModuleFixture);
                await safe.setModule(await safeProtocolMediator.getAddress());
                await safeProtocolRegistry.connect(owner).flagComponent(module);

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ModuleNotPermitted",
                );
            });

            it("Should not allow a Safe to enable SENTINEL_MODULES module", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithModuleFixture);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [SENTINEL_MODULES, false]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidModuleAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should allow a Safe to enable a module through a mediator", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);
                const moduleAddress = await module.getAddress();
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
                expect(await safeProtocolMediator.getModuleInfo(await safe.getAddress(), moduleAddress)).to.eql([false, SENTINEL_MODULES]);
            });

            it("Should fail to enable a module (with non root access) with root access", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);
                await safe.setModule(await safeProtocolMediator.getAddress());
                const moduleAddress = await module.getAddress();

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, true]);

                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ModuleAccessMismatch",
                );
                expect(await safeProtocolMediator.getModuleInfo(await safe.getAddress(), moduleAddress)).to.eql([false, ZeroAddress]);
            });
        });

        describe("Test disable module", async () => {
            it("Should not allow a Safe to disable zero address module", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithModuleFixture);
                await safe.setModule(await safeProtocolMediator.getAddress());
                const data = safeProtocolMediator.interface.encodeFunctionData("disableModule", [
                    hre.ethers.ZeroAddress,
                    hre.ethers.ZeroAddress,
                ]);
                await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidModuleAddress")
                    .withArgs(hre.ethers.ZeroAddress);
            });

            it("Should not allow a Safe to disable SENTINEL_MODULES module", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithModuleFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("disableModule", [SENTINEL_MODULES, SENTINEL_MODULES]);
                await expect(safe.exec(safeProtocolMediatorAddress, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidModuleAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should revert if nexModulePtr and module address do not match", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("disableModule", [
                    SENTINEL_MODULES,
                    await module.getAddress(),
                ]);
                await expect(safe.exec(safeProtocolMediatorAddress, 0, data))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidPrevModuleAddress")
                    .withArgs(SENTINEL_MODULES);
            });

            it("Should disable a module", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();
                const safeAddress = await safe.getAddress();

                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                expect(await safeProtocolMediator.getModuleInfo(safeAddress, moduleAddress)).to.eql([false, SENTINEL_MODULES]);

                const data2 = safeProtocolMediator.interface.encodeFunctionData("disableModule", [SENTINEL_MODULES, moduleAddress]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);
                expect(await safeProtocolMediator.getModuleInfo(safeAddress, moduleAddress)).to.eql([false, ZeroAddress]);
            });

            it("Should not allow enabling module if already enabled", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                expect(await safeProtocolMediator.getModuleInfo(await safe.getAddress(), moduleAddress)).to.eql([false, SENTINEL_MODULES]);

                await expect(safe.exec(safeProtocolMediatorAddress, 0, data)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ModuleAlreadyEnabled",
                );
            });
        });

        describe("Get paginated list of modules", async () => {
            it("Should revert with InvalidModuleAddress", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setModule(safeProtocolMediatorAddress);
                await expect(safeProtocolMediator.getModulesPaginated.staticCall(moduleAddress, 1, safe))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "InvalidModuleAddress")
                    .withArgs(moduleAddress);
            });

            it("Should revert with InvalidPageSize", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);
                await safe.setModule(await safeProtocolMediator.getAddress());
                await expect(
                    safeProtocolMediator.getModulesPaginated.staticCall(await module.getAddress(), 0, safe),
                ).to.be.revertedWithCustomError(safeProtocolMediator, "ZeroPageSizeNotAllowed");
            });

            it("Should return empty list if no modules are enabled", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithModuleFixture);
                await safe.setModule(await safeProtocolMediator.getAddress());
                expect(await safeProtocolMediator.getModulesPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([[], SENTINEL_MODULES]);
            });

            it("Should return list with one module", async () => {
                const { safeProtocolMediator, safe, module } = await loadFixture(deployContractsWithModuleFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                await safeProtocolMediator.getModuleInfo(await safe.getAddress(), moduleAddress);
                expect(await safeProtocolMediator.getModulesPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 2 modules starting from sentinel address", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithModuleFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const module2 = await (await hre.ethers.getContractFactory("TestModule")).deploy();
                const module2Address = await module2.getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(module2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enableModule", [module2Address, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);

                expect(await safeProtocolMediator.getModulesPaginated.staticCall(SENTINEL_MODULES, 10, safe)).to.eql([
                    [module2Address, moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 module starting from non-sentinel address", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithModuleFixture);

                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);

                const module2 = await (await hre.ethers.getContractFactory("TestModule")).deploy();
                const module2Address = await module2.getAddress();
                await safeProtocolRegistry.connect(owner).addComponent(module2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enableModule", [module2Address, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data2);
                expect(await safeProtocolMediator.getModulesPaginated.staticCall(module2Address, 10, safe)).to.eql([
                    [moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });

            it("Should return list with 1 module when called with pageSize 1", async () => {
                const { safeProtocolMediator, safe, module, safeProtocolRegistry } = await loadFixture(deployContractsWithModuleFixture);
                const safeProtocolMediatorAddress = await safeProtocolMediator.getAddress();
                const moduleAddress = await module.getAddress();

                await safe.setModule(safeProtocolMediatorAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
                await safe.exec(safeProtocolMediatorAddress, 0, data);
                const module2Address = await (await (await hre.ethers.getContractFactory("TestModule")).deploy()).getAddress();

                await safeProtocolRegistry.connect(owner).addComponent(module2Address);
                const data2 = safeProtocolMediator.interface.encodeFunctionData("enableModule", [module2Address, false]);

                await safe.exec(await safeProtocolMediator.getAddress(), 0, data2);
                expect(await safeProtocolMediator.getModulesPaginated.staticCall(SENTINEL_MODULES, 1, safe)).to.eql([
                    [module2Address],
                    module2Address,
                ]);

                expect(await safeProtocolMediator.getModulesPaginated.staticCall(module2Address, 1, safe)).to.eql([
                    [moduleAddress],
                    SENTINEL_MODULES,
                ]);
            });
        });
    });

    describe("Execute transaction from module", async () => {
        async function deployContractsWithEnabledMediatorFixture() {
            const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsFixture);
            await safe.setModule(await safeProtocolMediator.getAddress());
            return { safeProtocolMediator, safe, safeProtocolRegistry };
        }

        describe("Module with non-root access", async () => {
            it("Should not allow non-enabled module to execute tx from a safe", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const module = await (await hre.ethers.getContractFactory("TestModule")).deploy();
                const safeTx = buildSingleTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "MoudleNotEnabled",
                );
            });

            it("Should process a SafeTransaction and transfer ETH from safe to an EOA", async function () {
                const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModule")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), false]);
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
                const tx = await module.executeFromModule(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "ActionsExecuted").withArgs(safeAddress, safeTx.metaHash, 1);
            });

            it("Should revert with ActionExecutionFailed error if Safe doesn't have enough ETH balance", async function () {
                const { safeProtocolMediator, safeProtocolRegistry, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModule")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), false]);
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

                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ActionExecutionFailed",
                );
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);
                expect(balanceAfter).to.eql(balanceBefore);
            });

            it("Should not process a SafeTransaction if module is not permitted", async function () {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModule")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), false]);
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
                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ModuleNotPermitted",
                );
            });
        });

        describe("Module with root access", async () => {
            it("Should run a transaction from root access enabled module", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const safeAddress = await safe.getAddress();

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModuleWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), true]);
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
                const tx = await module.executeFromModule(safeProtocolMediator, safe, safeTx);
                await tx.wait();
                const balanceAfter = await hre.ethers.provider.getBalance(user1.address);

                expect(balanceAfter).to.eql(balanceBefore + amount);
                expect(await hre.ethers.provider.getBalance(safeAddress)).to.eql(0n);

                await expect(tx).to.emit(safeProtocolMediator, "RootAccessActionExecuted").withArgs(safeAddress, safeTx.metaHash);
            });

            it("Should not allow a transaction from root access if module is flagged", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testDelegateCallReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user2.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModuleWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), true]);
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
                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ModuleNotPermitted",
                );
            });

            it("Should not allow non-enabled module to execute root tx from a safe", async () => {
                const { safeProtocolMediator, safe } = await loadFixture(deployContractsWithEnabledMediatorFixture);
                const module = await (await hre.ethers.getContractFactory("TestModuleWithRootAccess")).deploy();
                const safeTx = buildRootTx(user1.address, hre.ethers.parseEther("1"), "0x", BigInt(1), hre.ethers.randomBytes(32));
                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "MoudleNotEnabled",
                );
            });

            it("Should revert with ModuleRequiresRootAccess if module indicates it doesn't need root access anymore", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiver")).deploy(user1.address);

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModuleWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                await module.setRequiresRootAccess(false);
                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );

                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "ModuleRequiresRootAccess",
                );
            });

            it("Should emit RootAccessActionExecutionFailed when root access action execution fails", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModuleWithRootAccess")).deploy();
                await safeProtocolRegistry.connect(owner).addComponent(await module.getAddress());

                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), true]);
                await safe.exec(await safeProtocolMediator.getAddress(), 0, data);

                const safeTx = buildRootTx(
                    await testFallbackReceiver.getAddress(),
                    hre.ethers.parseEther("1"),
                    "0x",
                    BigInt(1),
                    hre.ethers.randomBytes(32),
                );
                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx)).to.be.revertedWithCustomError(
                    safeProtocolMediator,
                    "RootAccessActionExecutionFailed",
                );
            });

            it("Should emit ModuleRequiresRootAccess for root access module", async () => {
                const { safeProtocolMediator, safe, safeProtocolRegistry } = await loadFixture(deployContractsWithEnabledMediatorFixture);

                const testFallbackReceiver = await (await hre.ethers.getContractFactory("TestFallbackReceiverReverter")).deploy();

                // Enable module
                const module = await (await hre.ethers.getContractFactory("TestModuleWithRootAccess")).deploy();
                const moduleAddress = await module.getAddress();
                await safeProtocolRegistry.connect(owner).addComponent(moduleAddress);
                const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [moduleAddress, false]);
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
                await expect(module.executeFromModule(safeProtocolMediator, safe, safeTx))
                    .to.be.revertedWithCustomError(safeProtocolMediator, "ModuleRequiresRootAccess")
                    .withArgs(moduleAddress);
            });
        });
    });
});
