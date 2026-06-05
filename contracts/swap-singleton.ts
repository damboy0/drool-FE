import {
  mockMarkets,
  mockMtM,
  mockPositions,
  mockTransaction,
} from "@/contracts/mock";
import type { Address, Hash, Market, MtMResult, SwapPosition } from "@/types";

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

export async function openSwap(
  marketId: string,
  notional: bigint,
  onBehalfOf: Address,
  mintNFT: boolean,
): Promise<Hash> {
  void marketId;
  void notional;
  void onBehalfOf;
  void mintNFT;
  return mockTransaction("openSwap");
}

export async function takeFloatingSide(positionId: bigint, onBehalfOf: Address): Promise<Hash> {
  void positionId;
  void onBehalfOf;
  return mockTransaction("takeFloatingSide");
}

export async function settlePosition(positionId: bigint): Promise<Hash> {
  void positionId;
  return mockTransaction("settlePosition");
}

export async function liquidate(positionId: bigint): Promise<Hash> {
  void positionId;
  return mockTransaction("liquidate");
}

export async function topUpMargin(positionId: bigint, amount: bigint): Promise<Hash> {
  void positionId;
  void amount;
  return mockTransaction("topUpMargin");
}

export async function getMarkToMarket(positionId: bigint): Promise<MtMResult> {
  return mockMtM(positionId);
}
