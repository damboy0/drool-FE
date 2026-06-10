import type { Address } from "@/types";

export type FixedFlowAddresses = {
  singleton?: Address;
  hook?: Address;
  oracle?: Address;
  nft?: Address;
  liquidationEngine?: Address;
  usdc?: Address;
  marketId: string;
};

export type SepoliaAaveAsset = {
  symbol: "LINK" | "WETH";
  underlying: Address;
  aToken: Address;
};

export const sepoliaContracts = {
  hook: "0x39fE01D9250B07036966aab8ac5a0359f756d6C6" as Address,
  oracle: "0x239B0AD6c22e8508713df9eF53360B5f970Cd666" as Address,
  singleton: "0x7d6a9c2cE05505f54bC8E05781d5b09b5f2bE4eE" as Address,
  usdc: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" as Address,
  poolManager: "0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A" as Address,
  aavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951" as Address,
} as const;

export const sepoliaAaveAssets: SepoliaAaveAsset[] = [
  {
    symbol: "WETH",
    underlying: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c" as Address,
    aToken: "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830" as Address,
  },
  {
    symbol: "LINK",
    underlying: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5" as Address,
    aToken: "0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24" as Address,
  },
];

export const sepoliaRehypothecationPoolKey = {
  currency0: sepoliaAaveAssets[0].underlying,
  currency1: sepoliaAaveAssets[1].underlying,
  fee: 3000,
  tickSpacing: 60,
} as const;

export const addresses: FixedFlowAddresses = {
  singleton: (process.env.NEXT_PUBLIC_SINGLETON_ADDRESS ?? sepoliaContracts.singleton) as Address,
  hook: (process.env.NEXT_PUBLIC_HOOK_ADDRESS ?? sepoliaContracts.hook) as Address,
  oracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS ?? sepoliaContracts.oracle) as Address,
  nft: process.env.NEXT_PUBLIC_NFT_ADDRESS as Address | undefined,
  liquidationEngine: process.env.NEXT_PUBLIC_LIQUIDATION_ENGINE_ADDRESS as Address | undefined,
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? sepoliaContracts.usdc) as Address,
  marketId: process.env.NEXT_PUBLIC_MARKET_ID ?? "0",
};

export function hasLiveContracts() {
  return Boolean(addresses.singleton && addresses.hook && addresses.oracle && addresses.nft);
}
