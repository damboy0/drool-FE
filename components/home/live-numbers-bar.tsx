"use client";

import Link from "next/link";
import { Activity, ExternalLink, PauseCircle, PiggyBank, Radio } from "lucide-react";
import { encodeAbiParameters, keccak256 } from "viem";
import { addresses, sepoliaContracts, sepoliaRehypothecationPoolKey } from "@/contracts/addresses";
import { useHookStatus, usePoolConfig } from "@/hooks/use-hook-status";
import { formatTokenAmount } from "@/lib/math";
import type { Address, PoolId } from "@/types";

const AAVE_WETH_APY = "2.84%";

function shorten(value?: string) {
  if (!value) return "Not configured";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function derivePoolId(hook: Address): PoolId {
  return keccak256(
    encodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            { name: "currency0", type: "address" },
            { name: "currency1", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "tickSpacing", type: "int24" },
            { name: "hooks", type: "address" },
          ],
        },
      ],
      [
        {
          currency0: sepoliaRehypothecationPoolKey.currency0,
          currency1: sepoliaRehypothecationPoolKey.currency1,
          fee: sepoliaRehypothecationPoolKey.fee,
          tickSpacing: sepoliaRehypothecationPoolKey.tickSpacing,
          hooks: hook,
        },
      ],
    ),
  ) as PoolId;
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: typeof PiggyBank;
  href?: string;
}) {
  const content = (
    <div className="flex h-full items-start gap-3 rounded-lg border border-white/10 bg-slate-900 p-4 transition hover:border-white/20">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sky-300">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
        <p className="mt-2 break-words text-lg font-semibold text-white">{value}</p>
        {detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} target="_blank" rel="noreferrer" className="block h-full">
      {content}
    </Link>
  );
}

export function LiveNumbersBar() {
  const hookAddress = addresses.hook ?? sepoliaContracts.hook;
  const poolId = derivePoolId(hookAddress);
  const { data: hookStatus, isLoading: hookLoading } = useHookStatus();
  const { data: poolConfig, isLoading: poolLoading } = usePoolConfig(poolId);
  const etherscanUrl = `https://sepolia.etherscan.io/address/${hookAddress}`;
  const status = hookLoading ? "Checking" : hookStatus?.paused ? "Paused" : "Live";
  const deployed = poolLoading || !poolConfig ? "Loading..." : `${formatTokenAmount(poolConfig.deployedToAave, 18)} WETH`;

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Total deployed to Aave"
        value={deployed}
        detail="Read from deployedToAave"
        icon={PiggyBank}
      />
      <Metric label="Current aWETH APY" value={AAVE_WETH_APY} detail="Sepolia display rate" icon={Activity} />
      <Metric
        label="Hook address"
        value={shorten(hookAddress)}
        detail="View on Etherscan"
        icon={ExternalLink}
        href={etherscanUrl}
      />
      <Metric
        label="Status"
        value={status}
        detail={hookStatus?.configured ? "Hook contract configured" : "Using configured Sepolia address"}
        icon={status === "Paused" ? PauseCircle : Radio}
      />
    </section>
  );
}
