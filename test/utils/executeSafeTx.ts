import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Safe } from "../../typechain-types";
import { AddressLike, BigNumberish, ContractTransactionResponse, ZeroAddress } from "ethers";
import hre from "hardhat";

export const execTransaction = async function (
    wallets: SignerWithAddress[],
    safe: Safe,
    to: AddressLike,
    value: BigNumberish,
    data: string,
    operation: number,
): Promise<ContractTransactionResponse> {
    const nonce = await safe.nonce();

    const transactionHash = await safe.getTransactionHash(to, value, data, operation, 0, 0, 0, ZeroAddress, ZeroAddress, nonce);
    let signatureBytes = "0x";
    const bytesDataHash = hre.ethers.getBytes(transactionHash);

    const sorted = Array.from(wallets).sort((a, b) => {
        return a.address.localeCompare(b.address, "en", { sensitivity: "base" });
    });

    for (let i = 0; i < sorted.length; i++) {
        const flatSig = (await sorted[i].signMessage(bytesDataHash)).replace(/1b$/, "1f").replace(/1c$/, "20");
        signatureBytes += flatSig.slice(2);
    }

    return await safe.execTransaction(to, value, data, operation, 0, 0, 0, ZeroAddress, ZeroAddress, signatureBytes);
};
