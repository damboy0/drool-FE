import { create } from "zustand";
import type { Address, SwapPosition } from "@/types";

type FixedFlowStore = {
  address?: Address;
  chainId?: number;
  positions: SwapPosition[];
  selectedPosition?: bigint;
  selectedMarket?: string;
  openModal?: "quick-swap" | "open-swap" | "take-floating";
  setWallet: (address?: Address, chainId?: number) => void;
  setPositions: (positions: SwapPosition[]) => void;
  selectPosition: (positionId?: bigint) => void;
  selectMarket: (marketId?: string) => void;
  setOpenModal: (modal?: FixedFlowStore["openModal"]) => void;
};

export const useFixedFlowStore = create<FixedFlowStore>((set) => ({
  positions: [],
  setWallet: (address, chainId) => set({ address, chainId }),
  setPositions: (positions) => set({ positions }),
  selectPosition: (selectedPosition) => set({ selectedPosition }),
  selectMarket: (selectedMarket) => set({ selectedMarket }),
  setOpenModal: (openModal) => set({ openModal }),
}));
