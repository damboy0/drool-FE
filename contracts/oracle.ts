import { readContract, writeContract } from "wagmi/actions";
import { cumulativeRateOracleAbi } from "@/contracts/abis/cumulative-rate-oracle";
import { addresses } from "@/contracts/addresses";
import { mockRateHistory } from "@/contracts/mock";
import { wagmiConfig } from "@/lib/wagmi";
import type { Address, Hash } from "@/types";

function shouldUseMocks() {
  return typeof window === "undefined" || !addresses.oracle;
}

function getOracleAddress(oracle?: Address) {
  return oracle ?? addresses.oracle;
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

export async function getOracleLastRate(oracle?: Address): Promise<number> {
  const oracleAddress = getOracleAddress(oracle);
  if (!shouldUseMocks() && oracleAddress) {
    const lastRateBps = await readContract(wagmiConfig, {
      address: oracleAddress,
      abi: cumulativeRateOracleAbi,
      functionName: "lastRateBps",
    });

    return Number(lastRateBps) / 100;
  }

  const points = mockRateHistory(addresses.marketId, 7);
  return points[points.length - 1]?.lastRate ?? 3;
}

export async function getTWAR(marketId: string, lookbackDays = 7, oracle?: Address): Promise<number> {
  const oracleAddress = getOracleAddress(oracle);
  if (!shouldUseMocks() && oracleAddress) {
    const lookbackSeconds = BigInt(lookbackDays * 24 * 60 * 60);
    const twarBps = await readContract(wagmiConfig, {
      address: oracleAddress,
      abi: cumulativeRateOracleAbi,
      functionName: "getTWAR",
      args: [lookbackSeconds],
    });

    return Number(twarBps) / 100;
  }

  const points = mockRateHistory(marketId, lookbackDays);
  const sum = points.reduce((total, point) => total + (point.twarRate ?? point.floatingRate ?? 0), 0);

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
