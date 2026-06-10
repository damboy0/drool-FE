export const swapSingletonAbi = [
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "markets",
    outputs: [
      { internalType: "address", name: "underlyingAsset", type: "address" },
      { internalType: "uint256", name: "termEnd", type: "uint256" },
      { internalType: "uint256", name: "leverageMultiplier", type: "uint256" },
      { internalType: "address", name: "oracle", type: "address" },
      { internalType: "uint256", name: "liquidationThresholdBps", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "notional", type: "uint256" },
      { internalType: "bool", name: "isFixedReceiver", type: "bool" },
      { internalType: "address", name: "onBehalfOf", type: "address" },
    ],
    name: "openSwap",
    outputs: [{ internalType: "uint256", name: "positionId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "positionId", type: "uint256" },
      { internalType: "address", name: "onBehalfOf", type: "address" },
    ],
    name: "takeFloatingSide",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "positionId", type: "uint256" }],
    name: "settlePosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "positionId", type: "uint256" }],
    name: "liquidate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "nextPositionId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
