import type { Address } from "@/types";

export type FixedFlowAddresses = {
  singleton?: Address;
  hook?: Address;
  oracle?: Address;
  nft?: Address;
  liquidationEngine?: Address;
};

export const addresses: FixedFlowAddresses = {
  singleton: process.env.NEXT_PUBLIC_SINGLETON_ADDRESS as Address | undefined,
  hook: process.env.NEXT_PUBLIC_HOOK_ADDRESS as Address | undefined,
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS as Address | undefined,
  nft: process.env.NEXT_PUBLIC_NFT_ADDRESS as Address | undefined,
  liquidationEngine: process.env.NEXT_PUBLIC_LIQUIDATION_ENGINE_ADDRESS as Address | undefined,
};

export function hasLiveContracts() {
  return Boolean(addresses.singleton && addresses.oracle && addresses.nft);
}
