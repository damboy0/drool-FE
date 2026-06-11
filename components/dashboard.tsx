"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, Percent, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { RateHistoryChart } from "@/components/charts/rate-history-chart";
import { QuickSwapCard } from "@/components/swap/quick-swap-card";
import { MetricCard } from "@/components/ui/metric-card";
import { useHookStatus } from "@/hooks/use-hook-status";
import { useMarketStats, useMarkets } from "@/hooks/use-market-data";
import { formatUsd } from "@/lib/math";

export function Dashboard() {
  const { data: markets = [], isLoading } = useMarkets();
  const { data: hookStatus } = useHookStatus();
  const { data: stats } = useMarketStats(markets[0]?.id ?? "");
  const [days, setDays] = useState(90);
  const primaryMarket = markets[0];
  const tvl = markets.reduce((sum, market) => sum + market.totalCollateral, 0n);
  const targetAaveAllocation = hookStatus ? Number(hookStatus.targetInPoolBps) / 100 : 0;

  if (isLoading || !primaryMarket) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading markets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total collateral" value={formatUsd(tvl)} detail="Summed across on-chain markets">
          <BadgeDollarSign className="size-5 text-sky-400" />
        </MetricCard>
        <MetricCard
          label="Oracle rate"
          value={`${primaryMarket.oracleRate.toFixed(2)}%`}
          detail={`Market #${primaryMarket.marketId.toString()}, ${primaryMarket.openPositions} open positions`}
        >
          <Percent className="size-5 text-emerald-400" />
        </MetricCard>
        <MetricCard
          label="Aave hook"
          value={hookStatus?.configured ? (hookStatus.paused ? "Paused" : "Live") : "Mock"}
          detail={
            hookStatus?.configured
              ? `${targetAaveAllocation.toFixed(0)}% target in pool`
              : "NEXT_PUBLIC_HOOK_ADDRESS not configured"
          }
        >
          <ShieldCheck className="size-5 text-amber-400" />
        </MetricCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-400">Oracle snapshots</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                TWAR and last rate on the deployed oracle
              </h1>
            </div>
            <Link
              href={`/markets/${primaryMarket.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200"
            >
              Market detail
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 flex gap-2">
            {[30, 90, 365].map((option) => (
              <button
                key={option}
                className={`rounded-md px-3 py-1.5 text-sm ${days === option ? "bg-sky-500 text-slate-950" : "bg-slate-950 text-slate-300"}`}
                onClick={() => setDays(option)}
              >
                {option === 365 ? "1y" : `${option}d`}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <RateHistoryChart marketId={primaryMarket.id} days={days} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Current comparison</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Oracle rate</p>
                <p className="mt-1 text-2xl font-semibold text-amber-400">{primaryMarket.oracleRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Average fixed</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-400">
                  {Number(stats?.averageFixedRate ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Open positions</p>
                <p className="mt-1 text-lg font-semibold text-white">{stats?.activePositions ?? primaryMarket.openPositions}</p>
              </div>
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Threshold</p>
                <p className="mt-1 text-lg font-semibold text-white">{primaryMarket.liquidationThresholdBps / 100}%</p>
              </div>
            </div>
          </section>
          <QuickSwapCard market={primaryMarket} />
        </div>
      </div>
    </div>
  );
}
