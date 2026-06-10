import { readContract, writeContract } from "wagmi/actions";
import { cumulativeRateOracleAbi } from "@/contracts/abis/cumulative-rate-oracle";
import { addresses } from "@/contracts/addresses";
import { mockRateHistory } from "@/contracts/mock";
import { wagmiConfig } from "@/lib/wagmi";
import type { Hash } from "@/types";

function shouldUseMocks() {
  return typeof window === "undefined" || !process.env.NEXT_PUBLIC_ORACLE_ADDRESS;
}

export async function getIndex(timestamp: number): Promise<bigint> {
  if (!shouldUseMocks() && addresses.oracle) {
    return readContract(wagmiConfig, {
      address: addresses.oracle,
      abi: cumulativeRateOracleAbi,
      functionName: "cumulativeIndex",
    });
  }

  return 1_000_000_000_000_000_000n + BigInt(timestamp % 1_000_000) * 1_000_000_000n;
}

export async function getTWAR(marketId: string, lookbackDays = 7): Promise<number> {
  if (!shouldUseMocks() && addresses.oracle) {
    const lookbackSeconds = BigInt(lookbackDays * 24 * 60 * 60);
    const twarBps = await readContract(wagmiConfig, {
      address: addresses.oracle,
      abi: cumulativeRateOracleAbi,
      functionName: "getTWAR",
      args: [lookbackSeconds],
    });

    return Number(twarBps) / 100;
  }

  const points = mockRateHistory(marketId, lookbackDays);
  const sum = points.reduce((total, point) => total + point.floatingRate, 0);

  return Number((sum / Math.max(1, points.length)).toFixed(2));
}

export async function advanceIndex(): Promise<bigint | Hash> {
  if (!shouldUseMocks() && addresses.oracle) {
    return writeContract(wagmiConfig, {
      address: addresses.oracle,
      abi: cumulativeRateOracleAbi,
      functionName: "advanceIndex",
    });
  }

  return getIndex(Math.floor(Date.now() / 1000));
}
