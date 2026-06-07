import { mockLiquidationHistory, mockMarkets, mockRateHistory } from "@/contracts/mock";
import type { Address } from "@/types";

export const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

export const queries = {
  getMarkets: "GET_MARKETS",
  getPositionHistory: "GET_POSITION_HISTORY",
  getRateSnapshots: "GET_RATE_SNAPSHOTS",
  getLiquidationEvents: "GET_LIQUIDATION_EVENTS",
} as const;

export async function getSubgraphMarkets() {
  return mockMarkets();
}

export async function getSubgraphPositionHistory(address: Address) {
  void address;
  return [];
}

export async function getSubgraphRateSnapshots(marketId: string, days: number) {
  return mockRateHistory(marketId, days);
}

export async function getSubgraphLiquidationEvents() {
  return mockLiquidationHistory();
}
