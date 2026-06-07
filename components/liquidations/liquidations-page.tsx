"use client";

import { Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { liquidatePosition } from "@/contracts/liquidations";
import { useLiquidationHistory, useLiquidations } from "@/hooks/use-liquidations";
import { formatUsd } from "@/lib/math";

export function LiquidationsPage() {
  const queryClient = useQueryClient();
  const { data: candidates = [], isLoading } = useLiquidations();
  const { data: history = [] } = useLiquidationHistory();
  const [pendingId, setPendingId] = useState<bigint | null>(null);

  async function submitLiquidation(positionId: bigint) {
    const candidate = candidates.find((item) => item.positionId === positionId);
    setPendingId(positionId);
    try {
      const hash = await liquidatePosition(positionId);
      toast.success(`Liquidation submitted: ${hash.slice(0, 10)}... Bounty earned: $${candidate?.bountyUSD.toFixed(2) ?? "0.00"}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["liquidations"] }),
        queryClient.invalidateQueries({ queryKey: ["liquidation-history"] }),
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Liquidation failed.");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading liquidation opportunities...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <p className="text-sm text-slate-400">Liquidations</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">At-risk positions and bounties</h1>
        <p className="mt-3 text-sm text-slate-400">Bot endpoint: <code className="rounded bg-slate-950 px-2 py-1 text-sky-300">/api/liquidations</code></p>
      </section>

      <section className="rounded-lg border border-white/10 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Position</th>
                <th className="px-5 py-3">Asset</th>
                <th className="px-5 py-3">Notional</th>
                <th className="px-5 py-3">Health</th>
                <th className="px-5 py-3">Bounty</th>
                <th className="px-5 py-3">Est. profit</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {candidates.map((candidate) => (
                <tr key={candidate.positionId.toString()} className={pendingId === candidate.positionId ? "text-slate-500 opacity-60" : "text-slate-200"}>
                  <td className="px-5 py-4">#{candidate.positionId.toString()}</td>
                  <td className="px-5 py-4">{candidate.asset}</td>
                  <td className="px-5 py-4">{formatUsd(candidate.notional)}</td>
                  <td className="px-5 py-4 text-red-300">{candidate.marginHealth.toFixed(1)}%</td>
                  <td className="px-5 py-4 text-amber-300">${candidate.bountyUSD.toFixed(2)}</td>
                  <td className="px-5 py-4 text-emerald-300">${(candidate.bountyUSD - candidate.estimatedGasUSD).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-sky-500 px-3 text-sm font-semibold text-slate-950 disabled:bg-slate-700"
                      disabled={pendingId === candidate.positionId}
                      onClick={() => submitLiquidation(candidate.positionId)}
                    >
                      <Zap className="size-4" /> {pendingId === candidate.positionId ? "Pending" : "Liquidate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-slate-900">
        <div className="border-b border-white/10 p-5">
          <p className="text-sm text-slate-400">History</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Recent liquidations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Position</th>
                <th className="px-5 py-3">Liquidator</th>
                <th className="px-5 py-3">Bounty paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {history.map((event) => (
                <tr key={event.id} className="text-slate-200">
                  <td className="px-5 py-4">{new Date(event.timestamp * 1000).toLocaleString()}</td>
                  <td className="px-5 py-4">#{event.positionId.toString()}</td>
                  <td className="px-5 py-4">{event.liquidator.slice(0, 6)}...{event.liquidator.slice(-4)}</td>
                  <td className="px-5 py-4 text-amber-300">{formatUsd(event.bountyPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
