"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarketStats, getMarkets, getOrderBook } from "@/contracts/swap-singleton";
import { mockRateHistory } from "@/contracts/mock";

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: getMarkets,
    refetchInterval: 12_000,
  });
}

export function useRateHistory(marketId: string, days: number) {
  return useQuery({
    queryKey: ["rate-history", marketId, days],
    queryFn: () => mockRateHistory(marketId, days),
    refetchInterval: 12_000,
  });
}

export function useMarket(marketId: string) {
  return useQuery({
    queryKey: ["market", marketId],
    queryFn: async () => {
      const markets = await getMarkets();
      const market = markets.find((item) => item.id === marketId);
      if (!market) throw new Error(`Market ${marketId} not found`);
      return market;
    },
    refetchInterval: 12_000,
  });
}

export function useOrderBook(marketId: string) {
  return useQuery({
    queryKey: ["order-book", marketId],
    queryFn: () => getOrderBook(marketId),
    refetchInterval: 12_000,
  });
}

export function useMarketStats(marketId: string) {
  return useQuery({
    queryKey: ["market-stats", marketId],
    queryFn: () => getMarketStats(marketId),
    refetchInterval: 12_000,
  });
}
