import { writeContract } from "wagmi/actions";
import { erc20Abi } from "@/contracts/abis/erc20";
import { onchainRouterAbi } from "@/contracts/abis/onchain-router";
import { addresses, sepoliaRehypothecationPoolKey } from "@/contracts/addresses";
import { wagmiConfig } from "@/lib/wagmi";
import type { Address, Hash } from "@/types";

const MAX_UINT256 = (2n ** 256n) - 1n;
const SQRT_PRICE_1_1_X96 = 79_228_162_514_264_337_593_543_950_336n;

export type PoolKey = {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};

export type ModifyLiquidityParams = {
  tickLower: number;
  tickUpper: number;
  liquidityDelta: bigint;
  salt: `0x${string}`;
};

export type SwapParams = {
  zeroForOne: boolean;
  amountSpecified: bigint;
  sqrtPriceLimitX96: bigint;
};

function getRouterAddress(): Address {
  if (!addresses.poolRouter) {
    throw new Error("NEXT_PUBLIC_POOL_ROUTER_ADDRESS is not configured.");
  }

  return addresses.poolRouter;
}

function getHookAddress(): Address {
  if (!addresses.hook) {
    throw new Error("NEXT_PUBLIC_HOOK_ADDRESS is not configured.");
  }

  return addresses.hook;
}

export function hasPoolRouter() {
  return Boolean(addresses.poolRouter);
}

export function getRehypothecationPoolKey(): PoolKey {
  return {
    currency0: sepoliaRehypothecationPoolKey.currency0,
    currency1: sepoliaRehypothecationPoolKey.currency1,
    fee: sepoliaRehypothecationPoolKey.fee,
    tickSpacing: sepoliaRehypothecationPoolKey.tickSpacing,
    hooks: getHookAddress(),
  };
}

export async function approvePoolRouterToken(token: Address, amount: bigint = MAX_UINT256): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [getRouterAddress(), amount],
  });
}

export async function initializeHookPool(sqrtPriceX96: bigint = SQRT_PRICE_1_1_X96): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getRouterAddress(),
    abi: onchainRouterAbi,
    functionName: "initialize",
    args: [getRehypothecationPoolKey(), sqrtPriceX96],
  });
}

export async function modifyHookPoolLiquidity(params: ModifyLiquidityParams, payer: Address): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getRouterAddress(),
    abi: onchainRouterAbi,
    functionName: "modifyLiquidity",
    args: [getRehypothecationPoolKey(), params, payer],
  });
}

export async function swapHookPool(params: SwapParams, payer: Address): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getRouterAddress(),
    abi: onchainRouterAbi,
    functionName: "swap",
    args: [getRehypothecationPoolKey(), params, payer],
  });
}
