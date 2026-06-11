"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarketStats, getMarkets, getOrderBook } from "@/contracts/swap-singleton";
import { getOracleLastRate, getTWAR } from "@/contracts/oracle";
import type { RatePoint } from "@/types";

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
    queryFn: async (): Promise<RatePoint[]> => {
      const markets = await getMarkets();
      const market = markets.find((item) => item.id === marketId);
      const oracle = market?.oracle;
      const currentRate = market ? market.oracleRate : await getOracleLastRate(oracle);
      const sampleCount = Math.max(4, Math.min(12, days));
      const step = Math.max(1, Math.floor(days / sampleCount));
      const lookbacks = Array.from({ length: sampleCount }, (_, index) => Math.max(1, days - index * step)).sort((a, b) => a - b);
      const now = Math.floor(Date.now() / 1000);
      const twarRates = await Promise.all(lookbacks.map((lookbackDays) => getTWAR(marketId, lookbackDays, oracle)));

      return lookbacks.map((lookbackDays, index) => ({
        timestamp: now - lookbackDays * 24 * 60 * 60,
        lookbackDays,
        twarRate: twarRates[index],
        lastRate: currentRate,
        floatingRate: twarRates[index],
        fixedRate: currentRate,
      }));
    },
    enabled: Boolean(marketId),
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
    enabled: Boolean(marketId),
    refetchInterval: 12_000,
  });
}
