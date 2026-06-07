"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { UtilizationBar } from "@/components/markets/utilization-bar";
import { useMarkets } from "@/hooks/use-market-data";
import { formatUsd } from "@/lib/math";
import type { Market } from "@/types";

type SortKey = "asset" | "floatingRate" | "fixedRateOffered" | "totalNotional" | "utilization" | "termEnd" | "openPositions";

function compareMarkets(a: Market, b: Market, key: SortKey) {
  if (key === "asset") return a.asset.localeCompare(b.asset);
  if (key === "totalNotional") return Number(b.totalNotional - a.totalNotional);
  return Number(b[key] - a[key]);
}

export function MarketsTable() {
  const { data: markets = [], isLoading } = useMarkets();
  const [sortKey, setSortKey] = useState<SortKey>("totalNotional");
  const [asset, setAsset] = useState("all");
  const [term, setTerm] = useState("all");
  const [utilization, setUtilization] = useState("all");

  const filtered = useMemo(() => {
    const now = Date.now() / 1000;

    return [...markets]
      .filter((market) => asset === "all" || market.asset === asset)
      .filter((market) => {
        const days = (market.termEnd - now) / 86_400;
        if (term === "short") return days <= 75;
        if (term === "standard") return days > 75 && days <= 100;
        if (term === "long") return days > 100;
        return true;
      })
      .filter((market) => {
        if (utilization === "low") return market.utilization < 60;
        if (utilization === "balanced") return market.utilization >= 60 && market.utilization < 75;
        if (utilization === "hot") return market.utilization >= 75;
        return true;
      })
      .sort((a, b) => compareMarkets(a, b, sortKey));
  }, [asset, markets, sortKey, term, utilization]);

  if (isLoading) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading markets...</div>;
  }

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">Markets</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Active fixed-rate swap terms</h1>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
            value={asset}
            onChange={(event) => setAsset(event.target.value)}
          >
            <option value="all">All assets</option>
            <option value="USDC">USDC</option>
            <option value="DAI">DAI</option>
            <option value="WETH">WETH</option>
          </select>
          <select
            className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          >
            <option value="all">All terms</option>
            <option value="short">60d or less</option>
            <option value="standard">90d terms</option>
            <option value="long">100d+</option>
          </select>
          <select
            className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
            value={utilization}
            onChange={(event) => setUtilization(event.target.value)}
          >
            <option value="all">All utilization</option>
            <option value="low">Below 60%</option>
            <option value="balanced">60-75%</option>
            <option value="hot">75%+</option>
          </select>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {[
                ["asset", "Asset"],
                ["floatingRate", "Floating APY"],
                ["fixedRateOffered", "Fixed offered"],
                ["totalNotional", "Total notional"],
                ["utilization", "Utilization"],
                ["termEnd", "Term end"],
                ["openPositions", "Open positions"],
              ].map(([key, label]) => (
                <th key={key} className="px-5 py-3">
                  <button className="inline-flex items-center gap-2" onClick={() => setSortKey(key as SortKey)}>
                    {label}
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((market) => (
              <tr key={market.id} className="text-slate-200 hover:bg-white/[0.03]">
                <td className="px-5 py-4">
                  <Link href={`/markets/${market.id}`} className="font-semibold text-white hover:text-sky-300">
                    {market.asset}
                  </Link>
                </td>
                <td className="px-5 py-4 text-amber-300">{market.floatingRate.toFixed(2)}%</td>
                <td className="px-5 py-4 text-emerald-300">{market.fixedRateOffered.toFixed(2)}%</td>
                <td className="px-5 py-4">{formatUsd(market.totalNotional)}</td>
                <td className="px-5 py-4"><UtilizationBar value={market.utilization} /></td>
                <td className="px-5 py-4">{new Date(market.termEnd * 1000).toLocaleDateString()}</td>
                <td className="px-5 py-4">{market.openPositions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {filtered.map((market) => (
          <Link key={market.id} href={`/markets/${market.id}`} className="rounded-lg border border-white/10 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{market.asset}</p>
              <p className="text-sm text-emerald-300">{market.fixedRateOffered.toFixed(2)}%</p>
            </div>
            <p className="mt-2 text-sm text-slate-400">{formatUsd(market.totalNotional)} total notional</p>
            <div className="mt-4">
              <UtilizationBar value={market.utilization} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
