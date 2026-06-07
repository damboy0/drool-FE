import { mockNFTs, mockTransferNFT } from "@/contracts/mock";
import type { Address, Hash, PositionNFT } from "@/types";

export async function getPositionNFTs(owner?: Address): Promise<PositionNFT[]> {
  return mockNFTs(owner);
}

export async function transferPositionNFT(tokenId: bigint, from: Address, to: Address): Promise<Hash> {
  return mockTransferNFT(tokenId, from, to);
}
