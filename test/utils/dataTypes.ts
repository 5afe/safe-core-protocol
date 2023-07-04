import { AddressLike } from "ethers";

export interface SafeProtocolAction {
    to: AddressLike;
    value: bigint;
    data: string;
}

export interface SafeTransaction {
    actions: SafeProtocolAction[];
    nonce: bigint;
    metaHash: Uint8Array;
}

export interface SafeRootAccess {
    action: SafeProtocolAction;
    nonce: bigint;
    metaHash: Uint8Array;
}
