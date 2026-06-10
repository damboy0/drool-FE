export const cumulativeRateOracleAbi = [
  {
    inputs: [],
    name: "cumulativeIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastRateBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "lookbackSeconds", type: "uint256" }],
    name: "getTWAR",
    outputs: [{ internalType: "uint256", name: "avgRateBps", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "advanceIndex",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
