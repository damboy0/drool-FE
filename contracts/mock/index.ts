import { calcRequiredMargin, classifyMarginHealth } from "@/lib/math";
import type {
  Address,
  Hash,
  LiquidationCandidate,
  LiquidationEvent,
  Market,
  MarketStats,
  MtMResult,
  PositionNFT,
  RatePoint,
  SwapPosition,
} from "@/types";

const MOCK_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const DAY = 24 * 60 * 60;
const USDC = 1_000_000n;
const LIVE_LIQUIDATION_ENGINE = "0x2222222222222222222222222222222222222222" as Address;

let nextPositionId = 401n;
const positionsByWallet = new Map<string, SwapPosition[]>();
const takenSeededPositionIds = new Set<string>();
let liquidationCandidates: LiquidationCandidate[] | undefined;
let liquidationHistory: LiquidationEvent[] | undefined;

function walletKey(address: Address = MOCK_ADDRESS) {
  return address.toLowerCase();
}

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
      marketId: 0n,
      asset: "USDC",
      label: "USDC market",
      underlyingAsset: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" as Address,
      termEnd: now + 90 * DAY,
      leverageMultiplier: 10,
      liquidationThresholdBps: 8_000,
      oracle: "0x239B0AD6c22e8508713df9eF53360B5f970Cd666" as Address,
      active: true,
      totalCollateral: 18_450_000n * USDC,
      openPositions: 42,
      oracleRate: 4.82,
      totalNotional: 18_450_000n * USDC,
      utilization: 68,
      fixedRateOffered: 5.34,
      floatingRate: 4.82,
    },
    {
      id: "dai-120d",
      marketId: 1n,
      asset: "DAI",
      label: "DAI market",
      underlyingAsset: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" as Address,
      termEnd: now + 120 * DAY,
      leverageMultiplier: 10,
      liquidationThresholdBps: 8_000,
      oracle: "0x239B0AD6c22e8508713df9eF53360B5f970Cd666" as Address,
      active: true,
      totalCollateral: 9_280_000n * USDC,
      openPositions: 27,
      oracleRate: 5.12,
      totalNotional: 9_280_000n * USDC,
      utilization: 74,
      fixedRateOffered: 5.78,
      floatingRate: 5.12,
    },
    {
      id: "weth-60d",
      marketId: 2n,
      asset: "WETH",
      label: "WETH market",
      underlyingAsset: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" as Address,
      termEnd: now + 60 * DAY,
      leverageMultiplier: 8,
      liquidationThresholdBps: 8_000,
      oracle: "0x239B0AD6c22e8508713df9eF53360B5f970Cd666" as Address,
      active: true,
      totalCollateral: 3_420_000n * USDC,
      openPositions: 18,
      oracleRate: 3.58,
      totalNotional: 3_420_000n * USDC,
      utilization: 51,
      fixedRateOffered: 3.91,
      floatingRate: 3.58,
    },
  ];
}

export function mockPositions(address: Address = MOCK_ADDRESS): SwapPosition[] {
  const key = walletKey(address);
  const cached = positionsByWallet.get(key);

  if (cached) return cached.map((position) => ({ ...position }));

  const markets = mockMarkets();
  const opened = nowSeconds() - 12 * DAY;

  const initialPositions: SwapPosition[] = [
    {
      positionId: 101n,
      marketId: markets[0].id,
      fixedReceiver: address,
      floatingReceiver: MOCK_ADDRESS,
      notional: 125_000n * USDC,
      fixedRate: markets[0].fixedRateOffered!,
      fixedMargin: calcRequiredMargin(125_000n * USDC, markets[0].fixedRateOffered!, 90, 10),
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
      floatingReceiver: "0x1111111111111111111111111111111111111111" as Address,
      notional: 80_000n * USDC,
      fixedRate: markets[1].fixedRateOffered!,
      fixedMargin: calcRequiredMargin(80_000n * USDC, markets[1].fixedRateOffered!, 120, 10),
      floatingMargin: calcRequiredMargin(80_000n * USDC, markets[1].floatingRate!, 120, 10),
      liquidationBounty: 180n * USDC,
      entryIndex: 1_000_000_000_000_000_000n,
      openTimestamp: opened - 6 * DAY,
      settled: false,
      nftMinted: false,
      matched: true,
    },
  ];

  positionsByWallet.set(key, initialPositions);
  return initialPositions.map((position) => ({ ...position }));
}

function replaceWalletPosition(address: Address, nextPosition: SwapPosition) {
  const key = walletKey(address);
  const positions = mockPositions(address).filter((position) => position.positionId !== nextPosition.positionId);
  positionsByWallet.set(key, [...positions, nextPosition]);
}

function updatePositionEverywhere(positionId: bigint, updater: (position: SwapPosition) => SwapPosition) {
  for (const [key, positions] of positionsByWallet.entries()) {
    positionsByWallet.set(
      key,
      positions.map((position) => (position.positionId === positionId ? updater(position) : position)),
    );
  }
}

function findPosition(positionId: bigint) {
  for (const positions of positionsByWallet.values()) {
    const position = positions.find((item) => item.positionId === positionId);
    if (position) return position;
  }

  return undefined;
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
      lookbackDays: age,
      twarRate: Number((market.oracleRate + wave + shock).toFixed(2)),
      lastRate: Number((market.oracleRate + wave * 0.35).toFixed(2)),
      floatingRate: Number((market.oracleRate + wave + shock).toFixed(2)),
      fixedRate: Number((market.oracleRate + wave * 0.35).toFixed(2)),
    };
  });
}

export function mockMtM(positionId: bigint): MtMResult {
  const position = findPosition(positionId);
  const drift = Math.sin(Date.now() / 45_000 + Number(positionId)) * 0.32;
  const basePercent = position?.settled ? 100 : positionId % 2n === 0n ? 46 : 72;
  const topUpBoost = position ? Number((position.fixedMargin + position.floatingMargin) / (500n * USDC)) : 0;
  const marginPercent = Math.max(8, Math.min(96, basePercent + drift * 20));
  const pnl = BigInt(Math.round(drift * 1_000)) * USDC;

  return {
    unrealizedPnL: pnl,
    marginHealth: classifyMarginHealth(marginPercent + topUpBoost),
    marginPercent: Number(Math.min(100, marginPercent + topUpBoost).toFixed(1)),
  };
}

export function mockMarketStats(marketId: string): MarketStats {
  const positions = mockPositions().filter((position) => position.marketId === marketId);
  const market = mockMarkets().find((item) => item.id === marketId) ?? mockMarkets()[0];

  return {
    totalOpenNotional: positions.reduce((sum, position) => sum + position.notional, (market.totalNotional ?? 0n) / 8n),
    activePositions: Math.max(market.openPositions, positions.length),
    averageFixedRate: (market.fixedRateOffered ?? 0) - 0.08,
    aaveYieldDeployed: (market.totalNotional ?? 0n) / 3n,
    liquidationBountyPool: BigInt(market.openPositions * 175) * USDC,
    totalCollateral: market.totalCollateral ?? market.totalNotional,
    liquidationThresholdBps: market.liquidationThresholdBps,
    oracleRate: market.oracleRate,
  };
}

export function mockOrderBook(marketId: string): SwapPosition[] {
  const market = mockMarkets().find((item) => item.id === marketId) ?? mockMarkets()[0];
  const base = nowSeconds() - 4 * 60 * 60;
  const userOrders = [...positionsByWallet.values()]
    .flat()
    .filter((position) => position.marketId === marketId && !position.matched && !position.settled);

  const seededOrders = Array.from({ length: 5 }, (_, index) => {
    const notional = BigInt(40_000 + index * 22_500) * USDC;

    return {
      positionId: BigInt(201 + index),
      marketId,
      fixedReceiver: `0x${(index + 3).toString().repeat(40).slice(0, 40)}` as Address,
      floatingReceiver: MOCK_ADDRESS,
      notional,
      fixedRate: Number(((market.fixedRateOffered ?? 0) + 0.18 - index * 0.06).toFixed(2)),
      fixedMargin: calcRequiredMargin(notional, market.fixedRateOffered ?? 0, 90, market.leverageMultiplier),
      floatingMargin: 0n,
      liquidationBounty: BigInt(120 + index * 35) * USDC,
      entryIndex: 1_000_000_000_000_000_000n,
      openTimestamp: base - index * 2 * 60 * 60,
      settled: false,
      nftMinted: index % 2 === 0,
      matched: false,
    };
  }).filter((position) => !takenSeededPositionIds.has(position.positionId.toString()));

  const byId = new Map<string, SwapPosition>();
  [...userOrders, ...seededOrders].forEach((position) => byId.set(position.positionId.toString(), position));

  return [...byId.values()].sort((a, b) => b.fixedRate - a.fixedRate);
}

export function mockLiquidations(): LiquidationCandidate[] {
  if (liquidationCandidates) return liquidationCandidates.map((item) => ({ ...item }));

  liquidationCandidates = [
    {
      positionId: 302n,
      marketId: "dai-120d",
      asset: "DAI",
      notional: 175_000n * USDC,
      marginHealth: 8,
      bountyUSD: 420,
      estimatedGasUSD: 18,
      contractAddress: LIVE_LIQUIDATION_ENGINE,
    },
    {
      positionId: 301n,
      marketId: "usdc-90d",
      asset: "USDC",
      notional: 240_000n * USDC,
      marginHealth: 13,
      bountyUSD: 360,
      estimatedGasUSD: 16,
      contractAddress: LIVE_LIQUIDATION_ENGINE,
    },
    {
      positionId: 303n,
      marketId: "weth-60d",
      asset: "WETH",
      notional: 96_000n * USDC,
      marginHealth: 18,
      bountyUSD: 188,
      estimatedGasUSD: 15,
      contractAddress: LIVE_LIQUIDATION_ENGINE,
    },
  ];

  return liquidationCandidates.sort((a, b) => b.bountyUSD - a.bountyUSD).map((item) => ({ ...item }));
}

export function mockLiquidationHistory(): LiquidationEvent[] {
  if (liquidationHistory) return liquidationHistory.map((item) => ({ ...item }));

  const now = nowSeconds();

  liquidationHistory = [
    {
      id: "liq-91",
      positionId: 91n,
      liquidator: "0x9999999999999999999999999999999999999999",
      bountyPaid: 145n * USDC,
      timestamp: now - 2 * DAY,
    },
    {
      id: "liq-77",
      positionId: 77n,
      liquidator: "0x7777777777777777777777777777777777777777",
      bountyPaid: 210n * USDC,
      timestamp: now - 5 * DAY,
    },
  ];

  return liquidationHistory.map((item) => ({ ...item }));
}

export function mockNFTs(owner: Address = MOCK_ADDRESS): PositionNFT[] {
  return mockPositions(owner)
    .filter((position) => position.nftMinted && !position.settled)
    .map((position) => ({
      tokenId: position.positionId,
      owner,
      marketId: position.marketId,
      positionId: position.positionId,
      svg: buildMockSvg(position),
    }));
}

function buildMockSvg(position: SwapPosition) {
  const market = mockMarkets().find((item) => item.id === position.marketId);
  const title = `${market?.asset ?? "USDC"} IRS #${position.positionId.toString()}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260" viewBox="0 0 420 260">
    <rect width="420" height="260" rx="18" fill="#020617"/>
    <rect x="18" y="18" width="384" height="224" rx="14" fill="#0f172a" stroke="#334155"/>
    <text x="34" y="58" fill="#38bdf8" font-family="Arial" font-size="18" font-weight="700">${title}</text>
    <text x="34" y="102" fill="#f8fafc" font-family="Arial" font-size="34" font-weight="700">${position.fixedRate.toFixed(2)}%</text>
    <text x="34" y="132" fill="#94a3b8" font-family="Arial" font-size="14">Fixed rate locked</text>
    <text x="34" y="174" fill="#f8fafc" font-family="Arial" font-size="20">${formatCompact(position.notional)} notional</text>
    <text x="34" y="210" fill="#10b981" font-family="Arial" font-size="16">${position.matched ? "Matched" : "Open order"}</text>
  </svg>`;
}

function formatCompact(value: bigint) {
  return `$${Number(value / USDC).toLocaleString()}`;
}

export async function mockTransaction(action: string): Promise<Hash> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return txHash(action);
}

export async function mockOpenSwap(
  marketId: string,
  notional: bigint,
  onBehalfOf: Address,
  mintNFT: boolean,
): Promise<Hash> {
  const market = mockMarkets().find((item) => item.id === marketId);
  if (!market) throw new Error("MarketExpired");
  if (market.termEnd <= nowSeconds()) throw new Error("MarketExpired");
  if (notional <= 0n) throw new Error("InvalidNotional");

  const termDays = Math.max(1, Math.ceil((market.termEnd - nowSeconds()) / DAY));
  const position: SwapPosition = {
    positionId: nextPositionId,
    marketId,
    fixedReceiver: onBehalfOf,
    floatingReceiver: MOCK_ADDRESS,
    notional,
    fixedRate: market.fixedRateOffered ?? 0,
    fixedMargin: calcRequiredMargin(notional, market.fixedRateOffered ?? 0, termDays, market.leverageMultiplier),
    floatingMargin: 0n,
    liquidationBounty: 225n * USDC,
    entryIndex: 1_000_000_000_000_000_000n,
    openTimestamp: nowSeconds(),
    settled: false,
    nftMinted: mintNFT,
    matched: false,
  };

  nextPositionId += 1n;
  replaceWalletPosition(onBehalfOf, position);
  return mockTransaction("openSwap");
}

export async function mockTakeFloatingSide(positionId: bigint, onBehalfOf: Address): Promise<Hash> {
  const existing = findPosition(positionId);
  if (existing?.matched) throw new Error("PositionAlreadyMatched");

  const seeded = mockOrderBook(existing?.marketId ?? "usdc-90d").find((position) => position.positionId === positionId);
  const position = existing ?? seeded;
  if (!position) throw new Error("PositionNotFound");

  const market = mockMarkets().find((item) => item.id === position.marketId) ?? mockMarkets()[0];
  const termDays = Math.max(1, Math.ceil((market.termEnd - nowSeconds()) / DAY));
  const matchedPosition = {
    ...position,
    floatingReceiver: onBehalfOf,
    floatingMargin: calcRequiredMargin(position.notional, market.floatingRate ?? 0, termDays, market.leverageMultiplier),
    matched: true,
  };

  takenSeededPositionIds.add(positionId.toString());
  updatePositionEverywhere(positionId, () => matchedPosition);
  replaceWalletPosition(onBehalfOf, matchedPosition);
  return mockTransaction("takeFloatingSide");
}

export async function mockSettlePosition(positionId: bigint): Promise<Hash> {
  updatePositionEverywhere(positionId, (position) => ({ ...position, settled: true }));
  return mockTransaction("settlePosition");
}

export async function mockTopUpMargin(positionId: bigint, amount: bigint): Promise<Hash> {
  if (amount <= 0n) throw new Error("InvalidMarginAmount");
  updatePositionEverywhere(positionId, (position) => ({
    ...position,
    fixedMargin: position.fixedMargin + amount,
  }));
  return mockTransaction("topUpMargin");
}

export async function mockEarlyExit(positionId: bigint): Promise<Hash> {
  updatePositionEverywhere(positionId, (position) => ({ ...position, settled: true }));
  return mockTransaction("earlyExit");
}

export async function mockLiquidate(positionId: bigint): Promise<Hash> {
  const candidate = mockLiquidations().find((item) => item.positionId === positionId);
  if (!candidate) throw new Error("PositionNotLiquidatable");

  liquidationCandidates = mockLiquidations().filter((item) => item.positionId !== positionId);
  liquidationHistory = [
    {
      id: `liq-${positionId.toString()}-${Date.now()}`,
      positionId,
      liquidator: "0x9999999999999999999999999999999999999999",
      bountyPaid: BigInt(Math.round(candidate.bountyUSD)) * USDC,
      timestamp: nowSeconds(),
    },
    ...mockLiquidationHistory(),
  ];
  updatePositionEverywhere(positionId, (position) => ({ ...position, settled: true }));
  return mockTransaction("liquidatePosition");
}

export async function mockTransferNFT(tokenId: bigint, from: Address, to: Address): Promise<Hash> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error("InvalidRecipient");

  const ownerPositions = mockPositions(from);
  const position = ownerPositions.find((item) => item.positionId === tokenId && item.nftMinted);
  if (!position) throw new Error("NFTNotFound");

  positionsByWallet.set(
    walletKey(from),
    ownerPositions.filter((item) => item.positionId !== tokenId),
  );
  replaceWalletPosition(to, { ...position, fixedReceiver: to });

  return mockTransaction("transferPositionNFT");
}
