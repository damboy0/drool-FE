"use client";

import { ArrowRight, Lock, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { openSwap } from "@/contracts/swap-singleton";
import { calcRequiredMargin, formatUsd } from "@/lib/math";
import type { Address, Market } from "@/types";

const USDC = 1_000_000n;

export function QuickSwapCard({ market }: { market: Market }) {
  const { address, isConnected } = useAccount();
  const [notional, setNotional] = useState("10000");
  const [mintNFT, setMintNFT] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const termDays = Math.max(1, Math.ceil((market.termEnd * 1000 - Date.now()) / 86_400_000));
  const notionalUnits = useMemo(() => {
    const parsed = Number(notional);
    return BigInt(Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 1_000_000) : 0);
  }, [notional]);
  const requiredMargin = calcRequiredMargin(
    notionalUnits,
    market.fixedRateOffered,
    termDays,
    market.leverageMultiplier,
  );

  async function handleOpenSwap() {
    if (!isConnected || !address) {
      toast.error("Connect a wallet to open a swap.");
      return;
    }

    if (notionalUnits <= 0n) {
      toast.error("Enter a valid notional amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await openSwap(market.id, notionalUnits, address as Address, mintNFT);
      toast.success(`Mock swap submitted: ${hash.slice(0, 10)}...`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Swap submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Quick Swap</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{market.asset} fixed-rate receiver</h2>
        </div>
        <Lock className="size-5 text-emerald-400" />
      </div>

      <label className="mt-5 block text-sm text-slate-300" htmlFor="notional">
        Notional
      </label>
      <div className="mt-2 flex items-center rounded-md border border-white/10 bg-slate-950 px-3">
        <input
          id="notional"
          className="h-12 flex-1 bg-transparent text-lg text-white outline-none"
          inputMode="decimal"
          value={notional}
          onChange={(event) => setNotional(event.target.value)}
        />
        <span className="text-sm text-slate-400">{market.asset}</span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-slate-950 p-3">
          <dt className="text-slate-500">Fixed rate</dt>
          <dd className="mt-1 text-lg font-semibold text-emerald-400">{market.fixedRateOffered.toFixed(2)}%</dd>
        </div>
        <div className="rounded-md bg-slate-950 p-3">
          <dt className="text-slate-500">Required margin</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{formatUsd(requiredMargin)}</dd>
        </div>
        <div className="rounded-md bg-slate-950 p-3">
          <dt className="text-slate-500">Term</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{termDays}d</dd>
        </div>
        <div className="rounded-md bg-slate-950 p-3">
          <dt className="text-slate-500">Leverage</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{market.leverageMultiplier}x</dd>
        </div>
      </dl>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          className="size-4 rounded border-white/20 bg-slate-950"
          checked={mintNFT}
          onChange={(event) => setMintNFT(event.target.checked)}
        />
        Mint position NFT
      </label>

      <button
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        disabled={!isConnected || isSubmitting || notionalUnits < USDC}
        onClick={handleOpenSwap}
      >
        {isConnected ? <ArrowRight className="size-4" /> : <Wallet className="size-4" />}
        {isSubmitting ? "Submitting..." : isConnected ? "Open Swap" : "Connect Wallet"}
      </button>
    </section>
  );
}
