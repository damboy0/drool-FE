"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useMarkets } from "@/hooks/use-market-data";
import { formatUsd } from "@/lib/math";
import type { Market } from "@/types";

type SortKey = "marketId" | "oracleRate" | "totalCollateral" | "termEnd" | "openPositions" | "status";

function compareMarkets(a: Market, b: Market, key: SortKey) {
  if (key === "marketId") return Number(a.marketId - b.marketId);
  if (key === "totalCollateral") return Number(b.totalCollateral - a.totalCollateral);
  if (key === "status") return Number(Number(b.active) - Number(a.active));
  return Number(b[key] - a[key]);
}

export function MarketsTable() {
  const { data: markets = [], isLoading } = useMarkets();
  const [sortKey, setSortKey] = useState<SortKey>("totalCollateral");
  const [status, setStatus] = useState("all");
  const [term, setTerm] = useState("all");

  const filtered = useMemo(() => {
    const now = Date.now() / 1000;

    return [...markets]
      .filter((market) => status === "all" || (status === "active" ? market.active : !market.active))
      .filter((market) => {
        const days = (market.termEnd - now) / 86_400;
        if (term === "short") return days <= 75;
        if (term === "standard") return days > 75 && days <= 100;
        if (term === "long") return days > 100;
        return true;
      })
      .sort((a, b) => compareMarkets(a, b, sortKey));
  }, [markets, sortKey, status, term]);

  if (isLoading) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading markets...</div>;
  }

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">Markets</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">On-chain market registry</h1>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All markets</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            >
            <option value="all">All terms</option>
            <option value="short">60d or less</option>
            <option value="standard">75-100d</option>
            <option value="long">100d+</option>
          </select>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {[
                ["marketId", "Market"],
                ["oracleRate", "Oracle rate"],
                ["totalCollateral", "Collateral"],
                ["openPositions", "Open positions"],
                ["termEnd", "Term end"],
                ["status", "Status"],
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
                    Market #{market.marketId.toString()}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {market.underlyingAsset.slice(0, 8)}...{market.underlyingAsset.slice(-6)}
                  </p>
                </td>
                <td className="px-5 py-4 text-amber-300">{market.oracleRate.toFixed(2)}%</td>
                <td className="px-5 py-4">{formatUsd(market.totalCollateral)}</td>
                <td className="px-5 py-4">{market.openPositions}</td>
                <td className="px-5 py-4">{new Date(market.termEnd * 1000).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${market.active ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
                    {market.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {filtered.map((market) => (
          <Link key={market.id} href={`/markets/${market.id}`} className="rounded-lg border border-white/10 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">Market #{market.marketId.toString()}</p>
              <p className="text-sm text-emerald-300">{market.oracleRate.toFixed(2)}%</p>
            </div>
            <p className="mt-2 text-sm text-slate-400">{formatUsd(market.totalCollateral)} collateral</p>
            <p className="mt-1 text-xs text-slate-500">{market.underlyingAsset.slice(0, 8)}...{market.underlyingAsset.slice(-6)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
