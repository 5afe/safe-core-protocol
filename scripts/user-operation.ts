/**
 * Script to execute an ERC-4337 user operation for a test executor.
 */

import { ethers, deployments } from "hardhat";

import { PLUGIN_PERMISSION_EXECUTE_CALL } from "../src/utils/constants";
import { UserOperationStruct } from "../typechain-types/@account-abstraction/contracts/interfaces/IAccount";

const BUNDLER = process.env.SAFE_PROTOCOL_ERC4337_BUNDLER_URL ?? "http://localhost:3000/rpc";
const ENTRYPOINT = process.env.SAFE_PROTOCOL_ERC4337_ENTRYPOINT ?? "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

async function main() {
    const bundler = await bundlerRpc(BUNDLER);

    const manager = await deployments
        .get("SafeProtocolManager")
        .then(({ address }) => ethers.getContractAt("SafeProtocolManager", address));
    const module = await deployments
        .get("SafeProtocol4337Module")
        .then(({ address }) => ethers.getContractAt("SafeProtocol4337Module", address));
    const handler = await ethers.getContractAt("ISafeProtocol4337Handler", await module.getAddress());
    const entrypoint = await ethers.getContractAt("EntryPoint", ENTRYPOINT);

    const account = await ethers.deployContract("TestExecutor", [await manager.getAddress()]);
    console.log(`using account ${await account.getAddress()}`);

    await fundAddress(await account.getAddress());
    await account.setModule(await manager.getAddress());
    await account.exec(
        await account.getAddress(),
        0,
        manager.interface.encodeFunctionData("enablePlugin", [await module.getAddress(), PLUGIN_PERMISSION_EXECUTE_CALL]),
    );
    await account.exec(
        await account.getAddress(),
        0,
        manager.interface.encodeFunctionData("setFunctionHandler", [handler.validateUserOp.fragment.selector, await handler.getAddress()]),
    );
    await account.exec(
        await account.getAddress(),
        0,
        manager.interface.encodeFunctionData("setFunctionHandler", [handler.executeUserOp.fragment.selector, await handler.getAddress()]),
    );

    const { maxFeePerGas, maxPriorityFeePerGas } = await ethers.provider.getFeeData();
    const op = {
        sender: await account.getAddress(),
        nonce: ethers.toBeHex(await entrypoint.getNonce(await account.getAddress(), 0)),
        initCode: "0x",
        callData: handler.interface.encodeFunctionData("executeUserOp", [ethers.ZeroAddress, 0, "0x"]),
        callGasLimit: ethers.toBeHex(100000),
        verificationGasLimit: ethers.toBeHex(200000),
        preVerificationGas: ethers.toBeHex(100000),
        maxFeePerGas: ethers.toBeHex(maxFeePerGas ?? 0),
        maxPriorityFeePerGas: ethers.toBeHex(maxPriorityFeePerGas ?? 0),
        paymasterAndData: "0x",
        signature: "0x",
    };
    console.log("sending operation", op);

    const result = await bundler.sendUserOperation(op, await entrypoint.getAddress());
    console.log("sent user operation", result);
}

async function bundlerRpc(url: string) {
    const provider = new ethers.JsonRpcProvider(url, await ethers.provider.getNetwork());
    return {
        sendUserOperation: async (op: UserOperationStruct, entrypoint: string) => {
            return await provider._send({
                jsonrpc: "2.0",
                method: "eth_sendUserOperation",
                params: [op, entrypoint],
                id: 4337,
            });
        },
    };
}

async function fundAddress(to: string) {
    const [signer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(to);
    const value = ethers.parseEther("1.0") - balance;
    if (value > 0n) {
        await signer.sendTransaction({ to, value }).then((tx) => tx.wait());
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
