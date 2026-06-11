"use client";

import { ArrowRight, Clock, Gauge, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { RateHistoryChart } from "@/components/charts/rate-history-chart";
import { takeFloatingSide } from "@/contracts/swap-singleton";
import { useMarket, useMarketStats, useOrderBook } from "@/hooks/use-market-data";
import { calcRequiredMargin, formatUsd } from "@/lib/math";
import type { Address, SwapPosition } from "@/types";

function ageLabel(timestamp: number) {
  const hours = Math.max(1, Math.floor((Date.now() / 1000 - timestamp) / 3600));
  return `${hours}h`;
}

export function MarketDetail({ marketId }: { marketId: string }) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { data: market, isLoading } = useMarket(marketId);
  const { data: orderBook = [] } = useOrderBook(marketId);
  const { data: stats } = useMarketStats(marketId);
  const [selected, setSelected] = useState<SwapPosition | null>(null);
  const [pending, setPending] = useState(false);

  const termDays = useMemo(() => {
    if (!market) return 0;
    return Math.max(0, Math.ceil((market.termEnd * 1000 - Date.now()) / 86_400_000));
  }, [market]);

  async function confirmTakeFloating() {
    if (!selected || !address) {
      toast.error("Connect a wallet to take the floating side.");
      return;
    }

    setPending(true);
    try {
      const hash = await takeFloatingSide(selected.positionId, address as Address);
      toast.success(`Floating side taken: ${hash.slice(0, 10)}...`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["order-book", marketId] }),
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
      ]);
      setSelected(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "PositionAlreadyMatched"
          ? "This position was just taken. Refreshing..."
          : error instanceof Error
            ? error.message
            : "Transaction failed.";
      toast.error(message);
      await queryClient.invalidateQueries({ queryKey: ["order-book", marketId] });
    } finally {
      setPending(false);
    }
  }

  if (isLoading || !market) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading market...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm text-slate-400">Market detail</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Market #{market.marketId.toString()}</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4 text-sky-300" />
                {termDays}d to expiry
              </span>
              <span className="inline-flex items-center gap-2">
                <Gauge className="size-4 text-amber-300" />
                {market.oracleRate.toFixed(2)}% oracle rate
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />
                {formatUsd(market.totalCollateral)} collateral
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {market.underlyingAsset.slice(0, 8)}...{market.underlyingAsset.slice(-6)} · threshold {market.liquidationThresholdBps / 100}%
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Oracle snapshots</p>
              <h2 className="mt-1 text-xl font-semibold text-white">TWAR lookback samples</h2>
            </div>
            <span className="text-sm text-sky-300">Live oracle data</span>
          </div>
          <div className="mt-6">
            <RateHistoryChart marketId={market.id} days={90} />
          </div>
        </section>

        <aside className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Market stats</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Open notional</dt>
              <dd className="font-medium text-white">{formatUsd(stats?.totalOpenNotional ?? 0n)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Active positions</dt>
              <dd className="font-medium text-white">{stats?.activePositions ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Avg fixed rate</dt>
              <dd className="font-medium text-emerald-300">{Number(stats?.averageFixedRate ?? 0).toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Total collateral</dt>
              <dd className="font-medium text-white">{formatUsd(stats?.totalCollateral ?? 0n)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Oracle rate</dt>
              <dd className="font-medium text-amber-300">{Number(stats?.oracleRate ?? 0).toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Threshold</dt>
              <dd className="font-medium text-white">{(stats?.liquidationThresholdBps ?? 0) / 100}%</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="rounded-lg border border-white/10 bg-slate-900">
        <div className="border-b border-white/10 p-5">
          <p className="text-sm text-slate-400">Order book depth</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Unmatched fixed-side positions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Position</th>
                <th className="px-5 py-3">Notional</th>
                <th className="px-5 py-3">Fixed rate</th>
                <th className="px-5 py-3">Margin posted</th>
                <th className="px-5 py-3">Age</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orderBook.map((position) => (
                <tr key={position.positionId.toString()} className="text-slate-200">
                  <td className="px-5 py-4">#{position.positionId.toString()}</td>
                  <td className="px-5 py-4">{formatUsd(position.notional)}</td>
                  <td className="px-5 py-4 text-emerald-300">{position.fixedRate.toFixed(2)}%</td>
                  <td className="px-5 py-4">{formatUsd(position.fixedMargin)}</td>
                  <td className="px-5 py-4">{ageLabel(position.openTimestamp)}</td>
                  <td className="px-5 py-4 text-slate-300">{position.matched ? "Matched" : "Open"}</td>
                  <td className="px-5 py-4">
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-sky-500 px-3 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
                      disabled={!isConnected}
                      onClick={() => setSelected(position)}
                    >
                      Take Floating <ArrowRight className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Take floating side</h2>
            <p className="mt-2 text-sm text-slate-400">You pay the fixed rate and receive the realized oracle floating rate.</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-slate-950 p-3">
                <dt className="text-slate-500">Notional</dt>
                <dd className="mt-1 text-white">{formatUsd(selected.notional)}</dd>
              </div>
              <div className="rounded-md bg-slate-950 p-3">
                <dt className="text-slate-500">Fixed paid</dt>
                <dd className="mt-1 text-emerald-300">{selected.fixedRate.toFixed(2)}%</dd>
              </div>
              <div className="rounded-md bg-slate-950 p-3">
                <dt className="text-slate-500">Margin required</dt>
                <dd className="mt-1 text-white">
                  {formatUsd(calcRequiredMargin(selected.notional, market.oracleRate, termDays, market.leverageMultiplier))}
                </dd>
              </div>
              <div className="rounded-md bg-slate-950 p-3">
                <dt className="text-slate-500">Bounty prefund</dt>
                <dd className="mt-1 text-amber-300">{formatUsd(selected.liquidationBounty)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
              If floating rates fall below break-even, your margin absorbs the loss.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button
                className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700"
                disabled={pending}
                onClick={confirmTakeFloating}
              >
                {pending ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
