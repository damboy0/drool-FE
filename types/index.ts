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
