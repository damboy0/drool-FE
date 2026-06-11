import { readContract, writeContract } from "wagmi/actions";
import { erc20Abi } from "@/contracts/abis/erc20";
import { swapSingletonAbi } from "@/contracts/abis/abi";
import { addresses } from "@/contracts/addresses";
import {
  mockEarlyExit,
  mockLiquidate,
  mockMarkets,
  mockMarketStats,
  mockMtM,
  mockOpenSwap,
  mockOrderBook,
  mockPositions,
  mockSettlePosition,
  mockTakeFloatingSide,
  mockTopUpMargin,
} from "@/contracts/mock";
import { getOracleLastRate, getTWAR } from "@/contracts/oracle";
import { calcMarginHealthPercent, calcNetSettlement, classifyMarginHealth } from "@/lib/math";
import { wagmiConfig } from "@/lib/wagmi";
import type { Address, Hash, Market, MarketStats, MtMResult, SwapPosition } from "@/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const MAX_UINT256 = (2n ** 256n) - 1n;
const DAY = 24 * 60 * 60;

function shouldUseMocks() {
  return typeof window === "undefined" || !addresses.singleton || !addresses.usdc || !addresses.oracle;
}

function getSingletonAddress(): Address {
  if (!addresses.singleton) throw new Error("NEXT_PUBLIC_SINGLETON_ADDRESS is not configured.");
  return addresses.singleton;
}

function getUsdcAddress(): Address {
  if (!addresses.usdc) throw new Error("NEXT_PUBLIC_USDC_ADDRESS is not configured.");
  return addresses.usdc;
}

function parseMarketId(marketId: string): bigint {
  return /^\d+$/.test(marketId) ? BigInt(marketId) : BigInt(addresses.marketId);
}

async function readMarketCount(): Promise<bigint> {
  return readContract(wagmiConfig, {
    address: getSingletonAddress(),
    abi: swapSingletonAbi,
    functionName: "nextMarketId",
  });
}

async function readPositionCount(): Promise<bigint> {
  return readContract(wagmiConfig, {
    address: getSingletonAddress(),
    abi: swapSingletonAbi,
    functionName: "nextPositionId",
  });
}

async function readMarket(marketId: bigint): Promise<Market> {
  const market = await readContract(wagmiConfig, {
    address: getSingletonAddress(),
    abi: swapSingletonAbi,
    functionName: "markets",
    args: [marketId],
  });

  const [underlyingAsset, termEnd, leverageMultiplier, oracle, liquidationThresholdBps, active] = market;
  const oracleRate = await getOracleLastRate(oracle as Address);
  const totalCollateral = await readContract(wagmiConfig, {
    address: getSingletonAddress(),
    abi: swapSingletonAbi,
    functionName: "totalCollateral",
    args: [underlyingAsset],
  });

  const allPositions = await readLivePositions();
  const marketKey = marketId.toString();

  return {
    id: marketKey,
    marketId,
    underlyingAsset,
    termEnd: Number(termEnd),
    leverageMultiplier: Number(leverageMultiplier),
    liquidationThresholdBps: Number(liquidationThresholdBps),
    oracle,
    active,
    totalCollateral,
    openPositions: allPositions.filter((position) => position.marketId === marketKey && !position.settled).length,
    oracleRate,
  };
}

function mapPosition(positionId: bigint, raw: readonly [bigint, Address, Address, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean]): SwapPosition {
  const [
    marketId,
    fixedReceiver,
    floatingReceiver,
    notional,
    fixedRateBps,
    fixedMargin,
    floatingMargin,
    liquidationBounty,
    entryIndex,
    openTimestamp,
    settled,
    floatingSideTaken,
  ] = raw;

  return {
    positionId,
    marketId: marketId.toString(),
    fixedReceiver,
    floatingReceiver,
    notional,
    fixedRate: Number(fixedRateBps) / 100,
    fixedMargin,
    floatingMargin,
    liquidationBounty,
    entryIndex,
    openTimestamp: Number(openTimestamp),
    settled,
    nftMinted: false,
    matched: floatingReceiver !== ZERO_ADDRESS,
    floatingSideTaken,
  };
}

async function readLivePosition(positionId: bigint): Promise<SwapPosition> {
  const raw = await readContract(wagmiConfig, {
    address: getSingletonAddress(),
    abi: swapSingletonAbi,
    functionName: "positions",
    args: [positionId],
  });

  return mapPosition(positionId, raw);
}

async function readLivePositions(): Promise<SwapPosition[]> {
  const nextPositionId = await readPositionCount();
  if (nextPositionId === 0n) return [];

  const ids = Array.from({ length: Number(nextPositionId) }, (_, index) => BigInt(index));
  return Promise.all(ids.map((positionId) => readLivePosition(positionId)));
}

export async function getMarkets(): Promise<Market[]> {
  if (shouldUseMocks()) return mockMarkets();

  const nextMarketId = await readMarketCount();
  const ids = Array.from({ length: Number(nextMarketId) }, (_, index) => BigInt(index));
  const markets = await Promise.all(ids.map((marketId) => readMarket(marketId)));
  return markets.sort((a, b) => Number(a.marketId - b.marketId));
}

export async function getSwapPosition(id: bigint): Promise<SwapPosition> {
  if (shouldUseMocks()) {
    const position = mockPositions().find((item) => item.positionId === id);
    if (!position) throw new Error(`Position ${id.toString()} not found`);
    return position;
  }

  return readLivePosition(id);
}

export async function getPositions(address: Address = ZERO_ADDRESS): Promise<SwapPosition[]> {
  if (shouldUseMocks()) return mockPositions(address);

  const positions = await readLivePositions();
  if (address === ZERO_ADDRESS) return [];

  const lower = address.toLowerCase();
  return positions.filter(
    (position) => position.fixedReceiver.toLowerCase() === lower || position.floatingReceiver.toLowerCase() === lower,
  );
}

export async function getOrderBook(marketId: string): Promise<SwapPosition[]> {
  if (shouldUseMocks()) return mockOrderBook(marketId);

  const positions = await readLivePositions();
  const key = parseMarketId(marketId).toString();
  return positions
    .filter((position) => position.marketId === key && !position.settled && position.floatingReceiver === ZERO_ADDRESS)
    .sort((a, b) => Number(b.notional - a.notional));
}

export async function getMarketStats(marketId: string): Promise<MarketStats> {
  if (shouldUseMocks()) return mockMarketStats(marketId);

  const market = await readMarket(parseMarketId(marketId));
  const positions = (await readLivePositions()).filter((position) => position.marketId === market.id && !position.settled);
  const totalOpenNotional = positions.reduce((sum, position) => sum + position.notional, 0n);
  const averageFixedRate = positions.length
    ? positions.reduce((sum, position) => sum + position.fixedRate, 0) / positions.length
    : 0;

  return {
    totalOpenNotional,
    activePositions: positions.length,
    averageFixedRate,
    totalCollateral: market.totalCollateral,
    liquidationThresholdBps: market.liquidationThresholdBps,
    oracleRate: market.oracleRate,
  };
}

export async function openSwap(
  marketId: string,
  notional: bigint,
  onBehalfOf: Address,
  mintNFT: boolean,
): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "openSwap",
      args: [parseMarketId(marketId), notional, mintNFT, onBehalfOf],
    });
  }

  return mockOpenSwap(marketId, notional, onBehalfOf, mintNFT);
}

export async function approveSwapCollateral(amount: bigint = MAX_UINT256): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getUsdcAddress(),
    abi: erc20Abi,
    functionName: "approve",
    args: [getSingletonAddress(), amount],
  });
}

export async function takeFloatingSide(positionId: bigint, onBehalfOf: Address): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "takeFloatingSide",
      args: [positionId, onBehalfOf],
    });
  }

  return mockTakeFloatingSide(positionId, onBehalfOf);
}

export async function settlePosition(positionId: bigint): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "settlePosition",
      args: [positionId],
    });
  }

  return mockSettlePosition(positionId);
}

export async function liquidate(positionId: bigint): Promise<Hash> {
  if (!shouldUseMocks()) {
    return writeContract(wagmiConfig, {
      address: getSingletonAddress(),
      abi: swapSingletonAbi,
      functionName: "liquidate",
      args: [positionId],
    });
  }

  return mockLiquidate(positionId);
}

export async function topUpMargin(positionId: bigint, amount: bigint): Promise<Hash> {
  if (!shouldUseMocks()) {
    throw new Error("topUpMargin is not exposed by the deployed contract ABI.");
  }

  return mockTopUpMargin(positionId, amount);
}

export async function earlyExit(positionId: bigint): Promise<Hash> {
  if (!shouldUseMocks()) {
    throw new Error("earlyExit is not exposed by the deployed contract ABI.");
  }

  return mockEarlyExit(positionId);
}

export async function getMarkToMarket(positionId: bigint): Promise<MtMResult> {
  if (shouldUseMocks()) return mockMtM(positionId);

  const position = await readLivePosition(positionId);
  const market = await readMarket(BigInt(position.marketId));
  const lookbackDays = Math.max(1, Math.ceil((Date.now() / 1000 - position.openTimestamp) / DAY));
  const floatingRate = await getTWAR(position.marketId, Math.min(lookbackDays, 90), market.oracle);
  const unrealizedPnL = calcNetSettlement(position.notional, position.fixedRate, floatingRate, lookbackDays);
  const initialMargin = position.fixedMargin + position.floatingMargin;
  const currentMargin = unrealizedPnL >= 0n ? initialMargin + unrealizedPnL : initialMargin - (-unrealizedPnL);
  const marginPercent = calcMarginHealthPercent(currentMargin > 0n ? currentMargin : 0n, initialMargin);

  return {
    unrealizedPnL,
    marginHealth: classifyMarginHealth(marginPercent),
    marginPercent,
  };
}
