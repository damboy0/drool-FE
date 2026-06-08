"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, Percent, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { RateHistoryChart } from "@/components/charts/rate-history-chart";
import { UtilizationBar } from "@/components/markets/utilization-bar";
import { QuickSwapCard } from "@/components/swap/quick-swap-card";
import { MetricCard } from "@/components/ui/metric-card";
import { useMarkets } from "@/hooks/use-market-data";
import { usePositions } from "@/hooks/use-positions";
import { formatUsd } from "@/lib/math";

export function Dashboard() {
  const { data: markets = [], isLoading } = useMarkets();
  const { data: positions = [] } = usePositions();
  const [days, setDays] = useState(90);
  const primaryMarket = markets[0];
  const tvl = markets.reduce((sum, market) => sum + market.totalNotional, 0n);

  if (isLoading || !primaryMarket) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading markets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total notional" value={formatUsd(tvl)} detail="Across active mock markets">
          <BadgeDollarSign className="size-5 text-sky-400" />
        </MetricCard>
        <MetricCard
          label="Best fixed rate"
          value={`${primaryMarket.fixedRateOffered.toFixed(2)}%`}
          detail={`${primaryMarket.asset} market, ${primaryMarket.openPositions} open positions`}
        >
          <Percent className="size-5 text-emerald-400" />
        </MetricCard>
        <MetricCard label="Portfolio positions" value={positions.length.toString()} detail="Wallet-aware mock data">
          <ShieldCheck className="size-5 text-amber-400" />
        </MetricCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-400">Rate history</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                Floating Aave rate vs. Drool quoted rate
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
                <p className="text-xs text-slate-500">Aave floating</p>
                <p className="mt-1 text-2xl font-semibold text-amber-400">{primaryMarket.floatingRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Drool fixed</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-400">
                  {primaryMarket.fixedRateOffered.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="mt-5">
              <UtilizationBar value={primaryMarket.utilization} />
            </div>
          </section>
          <QuickSwapCard market={primaryMarket} />
        </div>
      </div>
    </div>
  );
}
