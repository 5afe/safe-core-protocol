import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Safe } from "../../typechain-types";
import { AddressLike, BigNumberish } from "ethers";
import hre from "hardhat";

export const execTransaction = async function (
    wallets: SignerWithAddress[],
    safe: Safe,
    to: AddressLike,
    value: BigNumberish,
    data: string,
    operation: number,
) {
    const ADDRESS_0 = "0x0000000000000000000000000000000000000000";
    const nonce = await safe.nonce();

    const transactionHash = await safe.getTransactionHash(to, value, data, operation, 0, 0, 0, ADDRESS_0, ADDRESS_0, nonce);
    let signatureBytes = "0x";
    const bytesDataHash = hre.ethers.utils.arrayify(transactionHash);

    const sorted = Array.from(wallets).sort((a, b) => {
        return a.address.localeCompare(b.address, "en", { sensitivity: "base" });
    });

    for (let i = 0; i < sorted.length; i++) {
        const flatSig = (await sorted[i].signMessage(bytesDataHash)).replace(/1b$/, "1f").replace(/1c$/, "20");
        signatureBytes += flatSig.slice(2);
    }

    await safe.execTransaction(to, value, data, operation, 0, 0, 0, ADDRESS_0, ADDRESS_0, signatureBytes);
};
