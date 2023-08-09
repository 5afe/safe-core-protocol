import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AddressLike, Addressable, BaseContract } from "ethers";
import hre from "hardhat";
import { AddressZero } from "@ethersproject/constants";
import { Safe, SafeProxyFactory } from "../../typechain-types";
export const getInstance = async <T extends BaseContract>(name: string, address: string | Addressable): Promise<T> => {
    // TODO: this typecasting should be refactored
    return (await hre.ethers.getContractAt(name, address)) as unknown as T;
};

export const getSafeWithOwners = async (walletOwners: SignerWithAddress[], threshold: number, handler: AddressLike): Promise<Safe> => {
    const ownerAddresses = walletOwners.map((walletOwner) => walletOwner.address);

    const safeFactory = await hre.ethers.getContractFactory("Safe");
    const masterCopy = await safeFactory.deploy();

    const factory = await (await hre.ethers.getContractFactory("SafeProxyFactory")).deploy();
    const proxyFactory = await getInstance<SafeProxyFactory>("SafeProxyFactory", await factory.getAddress());

    const safeData = masterCopy.interface.encodeFunctionData("setup", [
        ownerAddresses,
        threshold,
        AddressZero,
        "0x",
        handler,
        AddressZero,
        0,
        AddressZero,
    ]);

    const safeTx = await proxyFactory.createProxyWithNonce(await masterCopy.getAddress(), safeData, 0n);

    const receipt = await safeTx.wait();

    const events = await proxyFactory.queryFilter(proxyFactory.filters.ProxyCreation, receipt?.blockNumber, receipt?.blockNumber);

    const safeAddress = events[0].args[0];
    return await getInstance("Safe", safeAddress);
};
