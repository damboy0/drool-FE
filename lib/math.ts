import type { MarginHealth } from "@/types";

const BASIS_POINTS = 10_000;
const DAYS_IN_YEAR = 365;

export function calcRequiredMargin(
  notional: bigint,
  fixedRate: number,
  termDays: number,
  leverage: number,
): bigint {
  if (notional < 0n || fixedRate < 0 || termDays < 0 || leverage <= 0) {
    throw new Error("Invalid margin inputs");
  }

  const annualizedRateBps = BigInt(Math.round(fixedRate * 100));
  const numerator = notional * annualizedRateBps * BigInt(termDays);
  const denominator = BigInt(BASIS_POINTS * DAYS_IN_YEAR * leverage);

  return numerator / denominator;
}

export function calcNetSettlement(
  notional: bigint,
  fixedRate: number,
  floatingRate: number,
  elapsedDays: number,
): bigint {
  if (notional < 0n || elapsedDays < 0) {
    throw new Error("Invalid settlement inputs");
  }

  const spreadBps = BigInt(Math.round((fixedRate - floatingRate) * 100));
  return (notional * spreadBps * BigInt(elapsedDays)) / BigInt(BASIS_POINTS * DAYS_IN_YEAR);
}

export function calcMarginHealthPercent(currentMargin: bigint, initialMargin: bigint): number {
  if (initialMargin <= 0n) return 0;
  return Number((currentMargin * 10_000n) / initialMargin) / 100;
}

export function classifyMarginHealth(percent: number): MarginHealth {
  if (percent > 60) return "healthy";
  if (percent > 30) return "warning";
  if (percent > 15) return "at-risk";
  return "danger";
}

export function formatTokenAmount(value: bigint, decimals = 6): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionText = fraction.toString().padStart(decimals, "0").slice(0, 2);

  return `${whole.toLocaleString()}.${fractionText}`;
}

export function formatUsd(value: bigint, decimals = 6): string {
  return `$${formatTokenAmount(value, decimals)}`;
}
