"use client";

import Link from "next/link";
import { ArrowRight, Banknote } from "lucide-react";
import { useMemo, useState } from "react";
import { useMarkToMarket, usePositions } from "@/hooks/use-positions";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/math";
import type { SwapPosition } from "@/types";

type Tab = "fixed" | "floating" | "settled";

function healthColor(percent: number) {
  if (percent > 60) return "bg-emerald-500";
  if (percent > 30) return "bg-yellow-400";
  if (percent > 15) return "bg-orange-500";
  return "bg-red-500";
}

function PositionCard({ position }: { position: SwapPosition }) {
  const { data: mtm } = useMarkToMarket(position.positionId);
  const marginPercent = mtm?.marginPercent ?? 0;

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Position #{position.positionId.toString()}</h2>
            {mtm ? <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs text-slate-300">{mtm.marginHealth}</span> : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">{position.marketId} / {position.matched ? "Matched" : "Open order"}</p>
        </div>
        <p className={cn("text-xl font-semibold", (mtm?.unrealizedPnL ?? 0n) >= 0n ? "text-emerald-300" : "text-red-300")}>
          {formatUsd(mtm?.unrealizedPnL ?? 0n)}
        </p>
      </div>

      {marginPercent < 15 ? (
        <div className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">Danger: liquidation imminent. Add margin before the next adverse rate move.</div>
      ) : null}

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-400">Margin health</span>
          <span className="text-white">{marginPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className={cn("h-full", healthColor(marginPercent))} style={{ width: `${Math.min(100, marginPercent)}%` }} />
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-md bg-slate-950 p-3"><dt className="text-slate-500">Notional</dt><dd className="mt-1 text-white">{formatUsd(position.notional)}</dd></div>
        <div className="rounded-md bg-slate-950 p-3"><dt className="text-slate-500">Fixed locked</dt><dd className="mt-1 text-emerald-300">{position.fixedRate.toFixed(2)}%</dd></div>
        <div className="rounded-md bg-slate-950 p-3"><dt className="text-slate-500">Accrued obligation</dt><dd className="mt-1 text-white">{formatUsd((position.fixedMargin + position.floatingMargin) / 3n)}</dd></div>
      </dl>

      <p className="mt-5 rounded-md border border-white/10 bg-slate-950 p-3 text-sm text-slate-400">
        Margin top-up and early exit are not exposed by the deployed contract ABI, so this view stays read-only.
      </p>
    </article>
  );
}

export function PortfolioPage() {
  const { data: positions = [], isLoading } = usePositions();
  const [tab, setTab] = useState<Tab>("fixed");
  const [sort, setSort] = useState("health");

  const filtered = useMemo(() => {
    return positions
      .filter((position) => {
        if (tab === "settled") return position.settled;
        if (tab === "floating") return position.floatingSideTaken;
        return !position.settled && !position.floatingSideTaken;
      })
      .sort((a, b) => {
        if (sort === "expiry") return a.openTimestamp - b.openTimestamp;
        if (sort === "notional") return Number(b.notional - a.notional);
        const aMarginRatio = Number(((a.fixedMargin + a.floatingMargin) * 10_000n) / a.notional);
        const bMarginRatio = Number(((b.fixedMargin + b.floatingMargin) * 10_000n) / b.notional);
        return aMarginRatio - bMarginRatio;
      });
  }, [positions, sort, tab]);

  if (isLoading) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading portfolio...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-400">Portfolio</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Swap positions and margin health</h1>
          </div>
          <select className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="health">Sort by margin risk</option>
            <option value="expiry">Sort by expiry</option>
            <option value="notional">Sort by notional</option>
          </select>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["fixed", "Fixed Side Positions"],
            ["floating", "Floating Side Positions"],
            ["settled", "Settled"],
          ].map(([value, label]) => (
            <button key={value} className={cn("rounded-md px-3 py-2 text-sm", tab === value ? "bg-sky-500 text-slate-950" : "bg-slate-950 text-slate-300")} onClick={() => setTab(value as Tab)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {filtered.length ? (
        <div className="grid gap-4">
          {filtered.map((position) => <PositionCard key={position.positionId.toString()} position={position} />)}
        </div>
      ) : (
        <section className="rounded-lg border border-white/10 bg-slate-900 p-8 text-center">
          <Banknote className="mx-auto size-10 text-slate-500" />
          <h2 className="mt-4 text-xl font-semibold text-white">No open positions</h2>
          <Link href="/markets" className="mt-4 inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Open your first swap <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
