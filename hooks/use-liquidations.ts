"use client";

import { useQuery } from "@tanstack/react-query";
import { getLiquidationHistory, getLiquidations } from "@/contracts/liquidations";

export function useLiquidations() {
  return useQuery({
    queryKey: ["liquidations"],
    queryFn: getLiquidations,
    refetchInterval: 12_000,
  });
}

export function useLiquidationHistory() {
  return useQuery({
    queryKey: ["liquidation-history"],
    queryFn: getLiquidationHistory,
    refetchInterval: 30_000,
  });
}
