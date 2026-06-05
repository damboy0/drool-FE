import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "FixedFlow",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "fixedflow-dev",
  chains: [sepolia, base],
  ssr: true,
});
