"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getPositionNFTs } from "@/contracts/nft";
import type { Address } from "@/types";

const fallbackAddress = "0x0000000000000000000000000000000000000000" as Address;

export function usePositionNFTs() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["position-nfts", address ?? fallbackAddress],
    queryFn: () => getPositionNFTs((address as Address | undefined) ?? fallbackAddress),
    refetchInterval: 12_000,
  });
}
