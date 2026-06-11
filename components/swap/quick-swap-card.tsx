"use client";

import { ArrowRight, Lock, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { waitForTransactionReceipt } from "wagmi/actions";
import { approveSwapCollateral, openSwap } from "@/contracts/swap-singleton";
import { advanceIndex } from "@/contracts/oracle";
import { wagmiConfig } from "@/lib/wagmi";
import { calcRequiredMargin, formatUsd } from "@/lib/math";
import type { Address, Market } from "@/types";

const USDC = 1_000_000n;

export function QuickSwapCard({ market }: { market: Market }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const queryClient = useQueryClient();
  const [notional, setNotional] = useState("10000");
  const [mintNFT, setMintNFT] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const termDays = Math.max(1, Math.ceil((market.termEnd * 1000 - currentTime) / 86_400_000));
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
  const isSepolia = chainId === sepolia.id;

  async function ensureSepolia() {
    if (isSepolia) return true;

    try {
      toast("Switching to Sepolia...");
      await switchChainAsync({ chainId: sepolia.id });
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Switch to Sepolia failed.");
      return false;
    }
  }

  async function handleOpenSwap() {
    if (!isConnected || !address) {
      toast.error("Connect a wallet to open a swap.");
      return;
    }

    if (notionalUnits <= 0n) {
      toast.error("Enter a valid notional amount.");
      return;
    }

    if (!(await ensureSepolia())) return;

    setIsSubmitting(true);
    try {
      toast("Confirm the oracle update in your wallet.");
      const oracleHash = await advanceIndex();
      if (typeof oracleHash === "bigint") {
        throw new Error("Oracle update did not produce a transaction hash.");
      }
      await waitForTransactionReceipt(wagmiConfig, { hash: oracleHash });
      toast.success("Oracle updated.");
      toast("Confirm the swap in your wallet.");
      const hash = await openSwap(market.id, notionalUnits, address as Address, mintNFT);
      toast.success(`Swap submitted: ${hash.slice(0, 10)}...`);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
        queryClient.invalidateQueries({ queryKey: ["order-book", market.id] }),
        queryClient.invalidateQueries({ queryKey: ["position-nfts"] }),
      ]);
      setStep(1);
    } catch (error) {
      const message = error instanceof Error && error.message === "MarketExpired"
        ? "This market has expired."
        : error instanceof Error
          ? error.message
          : "Swap submission failed.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function nextStep() {
    if (!isConnected || !address) {
      toast.error("Connect a wallet to open a swap.");
      return;
    }

    if (notionalUnits <= 0n) {
      toast.error("Enter a valid notional amount.");
      return;
    }

    setStep((current) => (current === 1 ? 2 : 3));
  }

  async function handleApprove() {
    if (!isConnected || !address) {
      toast.error("Connect a wallet to approve collateral.");
      return;
    }

    if (!(await ensureSepolia())) return;

    setIsApproving(true);
    try {
      toast("Confirm USDC approval in your wallet.");
      const hash = await approveSwapCollateral();
      toast.success(`Approval submitted: ${hash.slice(0, 10)}...`);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toast.success(`${market.asset} approval confirmed.`);
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setIsApproving(false);
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

      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        {["Configure", "Approve", "Confirm"].map((label, index) => (
          <div key={label} className={`rounded-md px-2 py-2 text-center ${step === index + 1 ? "bg-sky-500 text-slate-950" : "bg-slate-950 text-slate-400"}`}>
            {label}
          </div>
        ))}
      </div>

      {step === 2 ? (
        <p className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
          Approve {market.asset} collateral for the SwapSingleton before opening the swap.
        </p>
      ) : null}

      {step === 3 ? (
        <p className="mt-4 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          You receive fixed, pay floating, and post {formatUsd(requiredMargin)} margin for this term.
        </p>
      ) : null}

      <button
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        disabled={!isConnected || isSubmitting || isApproving || isSwitchingChain || notionalUnits < USDC}
        onClick={step === 3 ? handleOpenSwap : step === 2 ? handleApprove : nextStep}
      >
        {isConnected ? <ArrowRight className="size-4" /> : <Wallet className="size-4" />}
        {isSwitchingChain ? "Switching..." : isSubmitting ? "Submitting..." : isApproving ? "Approving..." : !isConnected ? "Connect Wallet" : step === 1 ? "Continue" : step === 2 ? "Approve USDC" : "Open Swap"}
      </button>
    </section>
  );
}
