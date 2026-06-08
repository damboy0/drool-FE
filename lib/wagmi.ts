import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Drool",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "drool-dev",
  chains: [sepolia, base],
  ssr: true,
});
