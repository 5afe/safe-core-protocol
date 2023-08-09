import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import hre, { deployments, ethers } from "hardhat";
import { getMockFunctionHandler, getFunctionHandlerWithFailingCallToSupportsInterfaceMethod } from "./utils/mockFunctionHandlerBuilder";
import { getSafeWithOwners } from "./utils/setup";
import { execTransaction } from "./utils/executeSafeTx";
import { IntegrationType } from "./utils/constants";
import { expect } from "chai";

describe("Test Function Handler", async () => {
    let deployer: SignerWithAddress, owner: SignerWithAddress;

    before(async () => {
        [deployer, owner] = await hre.ethers.getSigners();
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

        const testFunctionHandler = await ethers.deployContract("TestFunctionHandler", { signer: deployer });
        await safeProtocolRegistry.addIntegration(testFunctionHandler.target, IntegrationType.FunctionHandler);

        const safe = await getSafeWithOwners([owner], 1, functionHandlerManager.target);

        return { safe, functionHandlerManager, mockFunctionHandler, safeProtocolRegistry, testFunctionHandler };
    });

    it("Should emit FunctionHandlerChanged event when Function Handler is set", async () => {
        const { safe, functionHandlerManager, mockFunctionHandler } = await setupTests();

        // 0xf8a8fd6d -> function test() external {}
        const functionId = "0xf8a8fd6d";
        const dataSetFunctionHandler = functionHandlerManager.interface.encodeFunctionData("setFunctionHandler", [
            functionId,
            mockFunctionHandler.target,
        ]);

        const tx = await execTransaction([owner], safe, functionHandlerManager, 0n, dataSetFunctionHandler, 0);
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
        const { safe, functionHandlerManager } = await setupTests();

        const data = "0x00000000";

        await expect(
            deployer.sendTransaction({
                to: safe.target,
                value: 0,
                data: data,
            }),
        )
            .to.be.revertedWithCustomError(functionHandlerManager, "FunctionHandlerNotSet")
            .withArgs(safe.target, data);
    });

    it("Should call handle function of function handler", async () => {
        const { safe, functionHandlerManager, testFunctionHandler } = await setupTests();

        // 0xf8a8fd6d -> function test() external {}
        const data = "0xf8a8fd6d";

        const dataSetFunctionHandler = functionHandlerManager.interface.encodeFunctionData("setFunctionHandler", [
            data,
            testFunctionHandler.target,
        ]);

        await execTransaction([owner], safe, functionHandlerManager, 0n, dataSetFunctionHandler, 0);

        expect(
            await (
                await deployer.sendTransaction({
                    to: safe.target,
                    value: 0,
                    data: data,
                })
            ).wait(),
        );

        expect(await testFunctionHandler.inc()).to.equal(1);
    });
});
