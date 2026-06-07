"use client";

import Link from "next/link";
import { ArrowRight, Banknote, LogOut, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { earlyExit, topUpMargin } from "@/contracts/swap-singleton";
import { useMarkToMarket, usePositions } from "@/hooks/use-positions";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/math";
import { StatusPill } from "@/components/common/status-pill";
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
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [earlyExitOpen, setEarlyExitOpen] = useState(false);
  const [amount, setAmount] = useState("500");
  const [pending, setPending] = useState(false);
  const marginPercent = mtm?.marginPercent ?? 0;
  const projected = Math.min(100, marginPercent + Number(amount || 0) / 100);

  async function submitTopUp() {
    setPending(true);
    try {
      const units = BigInt(Math.max(0, Math.round(Number(amount) * 1_000_000)));
      const hash = await topUpMargin(position.positionId, units);
      toast.success(`Margin top-up submitted: ${hash.slice(0, 10)}...`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
        queryClient.invalidateQueries({ queryKey: ["mtm", position.positionId.toString()] }),
      ]);
      setTopUpOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Top-up failed.");
    } finally {
      setPending(false);
    }
  }

  async function submitEarlyExit() {
    setPending(true);
    try {
      const hash = await earlyExit(position.positionId);
      toast.success(`Early exit submitted: ${hash.slice(0, 10)}...`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
        queryClient.invalidateQueries({ queryKey: ["position-nfts"] }),
      ]);
      setEarlyExitOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Early exit failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Position #{position.positionId.toString()}</h2>
            {mtm ? <StatusPill status={mtm.marginHealth} /> : null}
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

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setTopUpOpen(true)}>
          <Plus className="size-4" /> Top up margin
        </button>
        <button className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10" disabled={pending} onClick={() => setEarlyExitOpen(true)}>
          <LogOut className="size-4" /> Exit early
        </button>
      </div>

      {topUpOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Top up margin</h3>
            <label className="mt-4 block text-sm text-slate-300" htmlFor={`topup-${position.positionId.toString()}`}>Additional margin</label>
            <input
              id={`topup-${position.positionId.toString()}`}
              className="mt-2 h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-white"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="mt-3 text-sm text-slate-400">Projected health after top-up: <span className="text-white">{projected.toFixed(1)}%</span></p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setTopUpOpen(false)}>Cancel</button>
              <button className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700" disabled={pending} onClick={submitTopUp}>
                {pending ? "Submitting..." : "Approve and top up"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {earlyExitOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Exit position early</h3>
            <p className="mt-3 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
              Exiting early forfeits remaining gains to the pool. Estimated penalty: {formatUsd(position.fixedMargin / 5n)}.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setEarlyExitOpen(false)}>Cancel</button>
              <button className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-700" disabled={pending} onClick={submitEarlyExit}>
                {pending ? "Submitting..." : "Confirm exit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
        if (tab === "floating") return position.matched;
        return !position.settled;
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
