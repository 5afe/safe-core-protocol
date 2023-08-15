import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import hre, { deployments, ethers } from "hardhat";
import { getMockFunctionHandler } from "./utils/mockFunctionHandlerBuilder";
import { IntegrationType } from "./utils/constants";
import { expect } from "chai";
import { getMockTestExecutorInstance, getInstance } from "./utils/contracts";
import { MaxUint256 } from "ethers";
import { ISafeProtocolFunctionHandler__factory, MockContract } from "../typechain-types";

describe("Test Function Handler", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

    before(async () => {
        [deployer, owner, user1, user2] = await hre.ethers.getSigners();
    });

    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        [owner] = await ethers.getSigners();
        const safeProtocolRegistry = await ethers.deployContract("SafeProtocolRegistry", [owner.address], { signer: deployer });
        const mockFunctionHandler = await getMockFunctionHandler();

        // Can possibly use a test instance of FunctionHandlerManager instead of SafeProtocolManager.
        // But, using SafeProtocolManager for testing with near production scenarios.
        const functionHandlerManager = await (
            await hre.ethers.getContractFactory("SafeProtocolManager")
        ).deploy(owner.address, await safeProtocolRegistry.getAddress());

        await safeProtocolRegistry.addIntegration(mockFunctionHandler.target, IntegrationType.FunctionHandler);

        const safe = await getMockTestExecutorInstance();

        return { safe, functionHandlerManager, mockFunctionHandler, safeProtocolRegistry };
    });

    it("Should emit FunctionHandlerChanged event when Function Handler is set", async () => {
        const { safe, functionHandlerManager, mockFunctionHandler } = await setupTests();

        // 0xf8a8fd6d -> function test() external {}
        const functionId = "0xf8a8fd6d";
        const dataSetFunctionHandler = functionHandlerManager.interface.encodeFunctionData("setFunctionHandler", [
            functionId,
            mockFunctionHandler.target,
        ]);

        const tx = await safe.executeCallViaMock(functionHandlerManager, 0n, dataSetFunctionHandler, MaxUint256);
        const receipt = await tx.wait();
        const events = (
            await functionHandlerManager.queryFilter(
                functionHandlerManager.filters.FunctionHandlerChanged,
                receipt?.blockNumber,
                receipt?.blockNumber,
            )
        )[0];
        expect(events.args).to.deep.equal([safe.target, functionId, mockFunctionHandler.target]);

        expect(await functionHandlerManager.getFunctionHandler.staticCall(safe.target, functionId)).to.be.equal(mockFunctionHandler.target);
    });

    it("Should not allow non permitted function handler", async () => {
        const { functionHandlerManager } = await setupTests();
        await expect(functionHandlerManager.setFunctionHandler("0x00000000", hre.ethers.ZeroAddress))
            .to.be.revertedWithCustomError(functionHandlerManager, "IntegrationNotPermitted")
            .withArgs(hre.ethers.ZeroAddress, 0, 0);
    });

    it("Should revert with FunctionHandlerNotSet when function handler is not enabled", async () => {
        const { functionHandlerManager } = await setupTests();

        const data = "0x00000000";

        await expect(
            user1.sendTransaction({
                to: functionHandlerManager.target,
                value: 0,
                data: data,
            }),
        )
            .to.be.revertedWithCustomError(functionHandlerManager, "FunctionHandlerNotSet")
            .withArgs(user1.address, data);
    });

    it("Should call handle function of function handler", async () => {
        const { functionHandlerManager, mockFunctionHandler } = await setupTests();

        // 0xf8a8fd6d -> function test() external {}
        const data = "0xf8a8fd6d";

        await functionHandlerManager.connect(user1).setFunctionHandler(data, mockFunctionHandler.target);
        const sender = user2.address;
        await (
            await user1.sendTransaction({
                to: functionHandlerManager.target,
                value: 0,
                data: data + sender.slice(2), // Handler expects additional 20 bytes data at the end that indicates original sender of transaction.
            })
        ).wait();

        const mockContract = await getInstance<MockContract>("MockContract", mockFunctionHandler.target);
        expect(await mockContract.invocationCountForMethod("0x25d6803f")).to.equal(1n);

        const handlerInterface = ISafeProtocolFunctionHandler__factory.createInterface();
        const expectedCallData = handlerInterface.encodeFunctionData("handle", [user1.address, user2.address, 0, "0xf8a8fd6d"]);

        expect(await mockContract.invocationCountForCalldata(expectedCallData)).to.equal(1n);
        expect(await mockContract.invocationCount()).to.equal(1n);
    });
});
