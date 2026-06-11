import { mockLiquidationHistory, mockLiquidations } from "@/contracts/mock";
import type { Hash, LiquidationCandidate, LiquidationEvent } from "@/types";

export async function getLiquidations(): Promise<LiquidationCandidate[]> {
  return mockLiquidations();
}

export async function getLiquidationHistory(): Promise<LiquidationEvent[]> {
  return mockLiquidationHistory();
}

export async function liquidatePosition(positionId: bigint): Promise<Hash> {
  const { liquidate } = await import("@/contracts/swap-singleton");
  return liquidate(positionId);
}
