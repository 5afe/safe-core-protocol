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

    it.only("Should set mediator as a module for a safe", async () => {
        const safe = await hre.ethers.deployContract("TestExecutor");

        const { safeProtocolMediator } = await loadFixture(deployContractFixture);
        await safe.setModule(await safeProtocolMediator.getAddress());
    });
});
