import { mockRateHistory } from "@/contracts/mock";

export async function getIndex(timestamp: number): Promise<bigint> {
  return 1_000_000_000_000_000_000n + BigInt(timestamp % 1_000_000) * 1_000_000_000n;
}

export async function getTWAR(marketId: string, lookbackDays = 7): Promise<number> {
  const points = mockRateHistory(marketId, lookbackDays);
  const sum = points.reduce((total, point) => total + point.floatingRate, 0);

  return Number((sum / Math.max(1, points.length)).toFixed(2));
}

export async function advanceIndex(): Promise<bigint> {
  return getIndex(Math.floor(Date.now() / 1000));
}
