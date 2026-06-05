"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getMarkToMarket, getPositions } from "@/contracts/swap-singleton";
import type { Address } from "@/types";

const fallbackAddress = "0x0000000000000000000000000000000000000000" as Address;

export function usePositions() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["positions", address ?? fallbackAddress],
    queryFn: () => getPositions((address as Address | undefined) ?? fallbackAddress),
    refetchInterval: 12_000,
  });
}

export function useMarkToMarket(positionId: bigint) {
  return useQuery({
    queryKey: ["mtm", positionId.toString()],
    queryFn: () => getMarkToMarket(positionId),
    refetchInterval: 12_000,
  });
}
