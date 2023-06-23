import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SafeProtocolMediator", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

    async function deployContractFixture() {
        [deployer, owner, user1, user2]= await hre.ethers.getSigners();
        const safeProtocolMediator = await (await hre.ethers.getContractFactory("SafeProtocolMediator")).deploy(owner.address);
        return { safeProtocolMediator };
    }

    describe("Setup mediator", async()=>{
        it("Should set mediator as a module for a safe", async () => {
            const safe = await hre.ethers.deployContract("TestExecutor");
    
            const { safeProtocolMediator } = await loadFixture(deployContractFixture);
            await safe.setModule(await safeProtocolMediator.getAddress());
        });
    })


    describe("Modules", async()=>{

        async function deployModuleFixture() {
            [deployer, owner, user1, user2]= await hre.ethers.getSigners();
            const safeProtocolMediator = await (await hre.ethers.getContractFactory("SafeProtocolMediator")).deploy(owner.address);
            const safe = await hre.ethers.deployContract("TestExecutor");
            const module = await (await hre.ethers.getContractFactory("TestModule")).deploy();
            return { safeProtocolMediator, safe, module };
        }

        it("Should allow a Safe to enable a module through a mediator", async () => {
            const { safeProtocolMediator, safe, module } = await loadFixture(deployModuleFixture);
            await safe.setModule(await safeProtocolMediator.getAddress());
            const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), false]);
            await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
            // TODO: Check for emitted events and param values
            expect(await safeProtocolMediator.getModuleInfo(await safe.getAddress(), await module.getAddress())).to.eql([true, false]);

        });
    
        it("Should fail to enable a module (with non root access) with root access", async () => {
            
            const { safeProtocolMediator, safe, module } = await loadFixture(deployModuleFixture);
            await safe.setModule(await safeProtocolMediator.getAddress());
            const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), true]);
            
            await expect(safe.exec(await safeProtocolMediator.getAddress(), 0, data)).to.be.revertedWithCustomError(safeProtocolMediator, "ModuleAccessMismatch");
            expect(await safeProtocolMediator.getModuleInfo(await safe.getAddress(), await module.getAddress())).to.eql([false, false]);

        });
    
        it("Should disable a module", async () => {
            const { safeProtocolMediator, safe, module } = await loadFixture(deployModuleFixture);
            await safe.setModule(await safeProtocolMediator.getAddress());
            const data = safeProtocolMediator.interface.encodeFunctionData("enableModule", [await module.getAddress(), false]);
            await safe.exec(await safeProtocolMediator.getAddress(), 0, data);
            expect(await safeProtocolMediator.getModuleInfo(await safe.getAddress(), await module.getAddress())).to.eql([true, false]);
            
            const data2 = safeProtocolMediator.interface.encodeFunctionData("disableModule", [await module.getAddress()]);
            await safe.exec(await safeProtocolMediator.getAddress(), 0, data2);
            // TODO: Check for emitted events and param values
            expect(await safeProtocolMediator.getModuleInfo(await safe.getAddress(), await module.getAddress())).to.eql([false, false]);
        });
    })

    
});
