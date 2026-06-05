import { calcRequiredMargin, classifyMarginHealth } from "@/lib/math";
import type { Address, Hash, Market, MtMResult, RatePoint, SwapPosition } from "@/types";

const MOCK_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const DAY = 24 * 60 * 60;
const USDC = 1_000_000n;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function txHash(seed: string): Hash {
  const body = Array.from(seed + Date.now().toString())
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .padEnd(64, "0")
    .slice(0, 64);

  return `0x${body}`;
}

export function mockMarkets(): Market[] {
  const now = nowSeconds();

  return [
    {
      id: "usdc-90d",
      asset: "USDC",
      termEnd: now + 90 * DAY,
      totalNotional: 18_450_000n * USDC,
      utilization: 68,
      fixedRateOffered: 5.34,
      floatingRate: 4.82,
      openPositions: 42,
      leverageMultiplier: 10,
    },
    {
      id: "dai-120d",
      asset: "DAI",
      termEnd: now + 120 * DAY,
      totalNotional: 9_280_000n * USDC,
      utilization: 74,
      fixedRateOffered: 5.78,
      floatingRate: 5.12,
      openPositions: 27,
      leverageMultiplier: 10,
    },
    {
      id: "weth-60d",
      asset: "WETH",
      termEnd: now + 60 * DAY,
      totalNotional: 3_420_000n * USDC,
      utilization: 51,
      fixedRateOffered: 3.91,
      floatingRate: 3.58,
      openPositions: 18,
      leverageMultiplier: 8,
    },
  ];
}

export function mockPositions(address: Address = MOCK_ADDRESS): SwapPosition[] {
  const markets = mockMarkets();
  const opened = nowSeconds() - 12 * DAY;

  return [
    {
      positionId: 101n,
      marketId: markets[0].id,
      fixedReceiver: address,
      floatingReceiver: MOCK_ADDRESS,
      notional: 125_000n * USDC,
      fixedRate: markets[0].fixedRateOffered,
      fixedMargin: calcRequiredMargin(125_000n * USDC, markets[0].fixedRateOffered, 90, 10),
      floatingMargin: 0n,
      liquidationBounty: 250n * USDC,
      entryIndex: 1_000_000_000_000_000_000n,
      openTimestamp: opened,
      settled: false,
      nftMinted: true,
      matched: false,
    },
    {
      positionId: 102n,
      marketId: markets[1].id,
      fixedReceiver: address,
      floatingReceiver: "0x1111111111111111111111111111111111111111",
      notional: 80_000n * USDC,
      fixedRate: markets[1].fixedRateOffered,
      fixedMargin: calcRequiredMargin(80_000n * USDC, markets[1].fixedRateOffered, 120, 10),
      floatingMargin: calcRequiredMargin(80_000n * USDC, markets[1].floatingRate, 120, 10),
      liquidationBounty: 180n * USDC,
      entryIndex: 1_000_000_000_000_000_000n,
      openTimestamp: opened - 6 * DAY,
      settled: false,
      nftMinted: false,
      matched: true,
    },
  ];
}

export function mockRateHistory(marketId: string, days = 90): RatePoint[] {
  const market = mockMarkets().find((item) => item.id === marketId) ?? mockMarkets()[0];
  const now = nowSeconds();

  return Array.from({ length: days }, (_, index) => {
    const age = days - index;
    const wave = Math.sin(index / 7) * 0.22;
    const shock = Math.cos(index / 13) * 0.11;

    return {
      timestamp: now - age * DAY,
      blockNumber: 5_600_000 + index * 7_200,
      floatingRate: Number((market.floatingRate + wave + shock).toFixed(2)),
      fixedRate: Number((market.fixedRateOffered + wave * 0.35).toFixed(2)),
    };
  });
}

export function mockMtM(positionId: bigint): MtMResult {
  const drift = Math.sin(Date.now() / 45_000 + Number(positionId)) * 0.32;
  const basePercent = positionId % 2n === 0n ? 46 : 72;
  const marginPercent = Math.max(8, Math.min(96, basePercent + drift * 20));
  const pnl = BigInt(Math.round(drift * 1_000)) * USDC;

  return {
    unrealizedPnL: pnl,
    marginHealth: classifyMarginHealth(marginPercent),
    marginPercent: Number(marginPercent.toFixed(1)),
  };
}

export async function mockTransaction(action: string): Promise<Hash> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return txHash(action);
}
