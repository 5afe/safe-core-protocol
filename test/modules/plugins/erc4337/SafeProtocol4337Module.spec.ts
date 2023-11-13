import EntryPoint from "@account-abstraction/contracts/artifacts/EntryPoint.json";
import { Signer } from "ethers";
import { ethers, deployments } from "hardhat";

import { MODULE_TYPE_PLUGIN, MODULE_TYPE_FUNCTION_HANDLER, PLUGIN_PERMISSION_EXECUTE_CALL } from "../../../../src/utils/constants";

describe("SafeProtocol4337Module", () => {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const [deployer, owner, user, bundler] = await ethers.getSigners();

        const registry = await ethers.deployContract("SafeProtocolRegistry", [owner.address]);
        const manager = await ethers.deployContract("SafeProtocolManager", [owner.address, await registry.getAddress()]);

        const entrypoint = await deployEntryPoint(deployer);
        const module = await ethers.deployContract("SafeProtocol4337Module", [await entrypoint.getAddress()]);
        const handler = await ethers.getContractAt("ISafeProtocol4337Handler", await module.getAddress());

        const account = await ethers.deployContract("TestExecutor", [await manager.getAddress()]);
        await account.setModule(await manager.getAddress());

        await registry.connect(owner).addModule(await module.getAddress(), MODULE_TYPE_PLUGIN | MODULE_TYPE_FUNCTION_HANDLER);
        await account.exec(
            await account.getAddress(),
            0,
            manager.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), PLUGIN_PERMISSION_EXECUTE_CALL]),
        );
        await account.exec(
            await account.getAddress(),
            0,
            manager.interface.encodeFunctionData("setFunctionHandler", [
                handler.validateUserOp.fragment.selector,
                await handler.getAddress(),
            ]),
        );
        await account.exec(
            await account.getAddress(),
            0,
            manager.interface.encodeFunctionData("setFunctionHandler", [
                handler.executeUserOp.fragment.selector,
                await handler.getAddress(),
            ]),
        );

        return { account, entrypoint, handler, user, bundler };
    });

    describe("handleOps", () => {
        it("should validate and execute user operations", async () => {
            const { account, entrypoint, handler, user, bundler } = await setupTests();

            await user.sendTransaction({
                to: await account.getAddress(),
                value: ethers.parseEther("1.0"),
            });

            const { maxFeePerGas, maxPriorityFeePerGas } = await ethers.provider.getFeeData();
            await entrypoint.connect(bundler).handleOps(
                [
                    {
                        sender: await account.getAddress(),
                        nonce: await entrypoint.getNonce(await account.getAddress(), 0),
                        initCode: "0x",
                        callData: handler.interface.encodeFunctionData("executeUserOp", [ethers.ZeroAddress, 0, "0x"]),
                        callGasLimit: 100000,
                        verificationGasLimit: 200000,
                        preVerificationGas: 100000,
                        maxFeePerGas: maxFeePerGas ?? 0,
                        maxPriorityFeePerGas: maxPriorityFeePerGas ?? 0,
                        paymasterAndData: "0x",
                        signature: "0x",
                    },
                ],
                bundler.address,
            );
        });
    });
});

async function deployEntryPoint(deployer: Signer) {
    const { abi, bytecode } = EntryPoint;
    const contract = await new ethers.ContractFactory(abi, bytecode, deployer).deploy();
    return await ethers.getContractAt("IEntryPoint", await contract.getAddress());
}
