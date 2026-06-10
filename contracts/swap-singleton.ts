import { readContract, writeContract } from "wagmi/actions";
import { erc20Abi } from "@/contracts/abis/erc20";
import { swapSingletonAbi } from "@/contracts/abis/swap-singleton";
import { addresses } from "@/contracts/addresses";
import {
  mockMarkets,
  mockMarketStats,
  mockMtM,
  mockEarlyExit,
  mockLiquidate,
  mockOrderBook,
  mockOpenSwap,
  mockPositions,
  mockSettlePosition,
  mockTakeFloatingSide,
  mockTopUpMargin,
} from "@/contracts/mock";
import { getTWAR } from "@/contracts/oracle";
import { wagmiConfig } from "@/lib/wagmi";
import type { Address, Hash, Market, MarketStats, MtMResult, SwapPosition } from "@/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const MAX_UINT256 = (2n ** 256n) - 1n;

function shouldUseMocks() {
  return typeof window === "undefined" || !process.env.NEXT_PUBLIC_SINGLETON_ADDRESS;
}

function getSingletonAddress(): Address {
  if (!addresses.singleton) throw new Error("NEXT_PUBLIC_SINGLETON_ADDRESS is not configured.");
  return addresses.singleton;
}

function getUsdcAddress(): Address {
  if (!addresses.usdc) throw new Error("NEXT_PUBLIC_USDC_ADDRESS is not configured.");
  return addresses.usdc;
}

function parseMarketId(marketId: string): bigint {
  return /^\d+$/.test(marketId) ? BigInt(marketId) : BigInt(addresses.marketId);
}

export async function getMarkets(): Promise<Market[]> {
  if (shouldUseMocks()) return mockMarkets();

  const marketId = parseMarketId(addresses.marketId);
  const [market, floatingRate] = await Promise.all([
    readContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "markets",
      args: [marketId],
    }),
    getTWAR(addresses.marketId),
  ]);

  const [underlyingAsset, termEnd, leverageMultiplier, oracle, liquidationThresholdBps, active] = market;
  if (!active) return [];

  return [
    {
      id: addresses.marketId,
      asset: "USDC",
      termEnd: Number(termEnd),
      totalNotional: 0n,
      utilization: 0,
      fixedRateOffered: floatingRate + 1,
      floatingRate,
      openPositions: 0,
      leverageMultiplier: Number(leverageMultiplier),
    },
  ];
}

export async function getSwapPosition(id: bigint): Promise<SwapPosition> {
  if (shouldUseMocks()) {
    const position = mockPositions().find((item) => item.positionId === id);
    if (!position) throw new Error(`Position ${id.toString()} not found`);
    return position;
  }

  const position = mockPositions().find((item) => item.positionId === id);
  if (!position) throw new Error(`Position ${id.toString()} not found`);
  return position;
}

export async function getPositions(address: Address = ZERO_ADDRESS): Promise<SwapPosition[]> {
  if (shouldUseMocks()) return mockPositions(address);
  return mockPositions(address);
}

export async function getOrderBook(marketId: string): Promise<SwapPosition[]> {
  return mockOrderBook(marketId);
}

export async function getMarketStats(marketId: string): Promise<MarketStats> {
  return mockMarketStats(marketId);
}

export async function openSwap(
  marketId: string,
  notional: bigint,
  onBehalfOf: Address,
  mintNFT: boolean,
): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "openSwap",
      args: [parseMarketId(marketId), notional, true, onBehalfOf],
    });
  }

  return mockOpenSwap(marketId, notional, onBehalfOf, mintNFT);
}

export async function approveSwapCollateral(amount: bigint = MAX_UINT256): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getUsdcAddress(),
    abi: erc20Abi,
    functionName: "approve",
    args: [getSingletonAddress(), amount],
  });
}

export async function takeFloatingSide(positionId: bigint, onBehalfOf: Address): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "takeFloatingSide",
      args: [positionId, onBehalfOf],
    });
  }

  return mockTakeFloatingSide(positionId, onBehalfOf);
}

export async function settlePosition(positionId: bigint): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "settlePosition",
      args: [positionId],
    });
  }

  return mockSettlePosition(positionId);
}

export async function liquidate(positionId: bigint): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "liquidate",
      args: [positionId],
    });
  }

  return mockLiquidate(positionId);
}

export async function topUpMargin(positionId: bigint, amount: bigint): Promise<Hash> {
  return mockTopUpMargin(positionId, amount);
}

export async function earlyExit(positionId: bigint): Promise<Hash> {
  return mockEarlyExit(positionId);
}

export async function getMarkToMarket(positionId: bigint): Promise<MtMResult> {
  return mockMtM(positionId);
}
