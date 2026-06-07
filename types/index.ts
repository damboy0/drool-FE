export type Address = `0x${string}`;
export type Hash = `0x${string}`;

export type AssetSymbol = "USDC" | "DAI" | "WETH";

export type Market = {
  id: string;
  asset: AssetSymbol;
  termEnd: number;
  totalNotional: bigint;
  utilization: number;
  fixedRateOffered: number;
  floatingRate: number;
  openPositions: number;
  leverageMultiplier: number;
};

export type SwapPosition = {
  positionId: bigint;
  marketId: string;
  fixedReceiver: Address;
  floatingReceiver: Address;
  notional: bigint;
  fixedRate: number;
  fixedMargin: bigint;
  floatingMargin: bigint;
  liquidationBounty: bigint;
  entryIndex: bigint;
  openTimestamp: number;
  settled: boolean;
  nftMinted: boolean;
  matched: boolean;
};

export type MarginHealth = "healthy" | "warning" | "at-risk" | "danger";

export type MtMResult = {
  unrealizedPnL: bigint;
  marginHealth: MarginHealth;
  marginPercent: number;
};

export type RatePoint = {
  timestamp: number;
  blockNumber: number;
  floatingRate: number;
  fixedRate: number;
};

export type LiquidationCandidate = {
  positionId: bigint;
  marketId: string;
  asset: AssetSymbol;
  notional: bigint;
  marginHealth: number;
  bountyUSD: number;
  estimatedGasUSD: number;
  contractAddress: Address;
};

export type LiquidationEvent = {
  id: string;
  positionId: bigint;
  liquidator: Address;
  bountyPaid: bigint;
  timestamp: number;
};

export type PositionNFT = {
  tokenId: bigint;
  owner: Address;
  marketId: string;
  positionId: bigint;
  svg: string;
};

export type MarketStats = {
  totalOpenNotional: bigint;
  activePositions: number;
  averageFixedRate: number;
  aaveYieldDeployed: bigint;
  liquidationBountyPool: bigint;
};
