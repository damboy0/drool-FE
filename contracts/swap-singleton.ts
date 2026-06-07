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
import type { Address, Hash, Market, MarketStats, MtMResult, SwapPosition } from "@/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

function shouldUseMocks() {
  return !process.env.NEXT_PUBLIC_SINGLETON_ADDRESS;
}

export async function getMarkets(): Promise<Market[]> {
  if (shouldUseMocks()) return mockMarkets();
  return mockMarkets();
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
  return mockOpenSwap(marketId, notional, onBehalfOf, mintNFT);
}

export async function takeFloatingSide(positionId: bigint, onBehalfOf: Address): Promise<Hash> {
  return mockTakeFloatingSide(positionId, onBehalfOf);
}

export async function settlePosition(positionId: bigint): Promise<Hash> {
  return mockSettlePosition(positionId);
}

export async function liquidate(positionId: bigint): Promise<Hash> {
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
