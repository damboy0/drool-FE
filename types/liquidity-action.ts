import type { Address, Hash, PoolId } from "@/types";

export type LiquidityActionKind = "add" | "remove";

export type LiquidityActionRecord = {
  id: string;
  wallet: Address;
  hook: Address;
  poolId: PoolId;
  txHash: Hash;
  action: LiquidityActionKind;
  pair: string;
  tickLower: number;
  tickUpper: number;
  liquidityDelta: string;
  salt: `0x${string}`;
  createdAt: string;
};
