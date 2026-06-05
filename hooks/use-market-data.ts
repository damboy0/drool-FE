"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarkets } from "@/contracts/swap-singleton";
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
