"use client";

import { useQuery } from "@tanstack/react-query";
import { getHookStatus, getPoolConfig } from "@/contracts/aave-liquidity-hook";
import type { PoolId } from "@/types";

export function useHookStatus() {
  return useQuery({
    queryKey: ["hook-status"],
    queryFn: getHookStatus,
    refetchInterval: 12_000,
  });
}

export function usePoolConfig(poolId?: PoolId) {
  return useQuery({
    queryKey: ["hook-pool-config", poolId],
    queryFn: () => getPoolConfig(poolId as PoolId),
    enabled: Boolean(poolId),
    refetchInterval: 12_000,
  });
}
