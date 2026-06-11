"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Droplets, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { sepolia } from "wagmi/chains";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { addresses, sepoliaRehypothecationPoolKey } from "@/contracts/addresses";
import {
  approvePoolRouterToken,
  initializeHookPool,
  modifyHookPoolLiquidity,
  swapHookPool,
} from "@/contracts/pool-router";
import { wagmiConfig } from "@/lib/wagmi";
import type { Address } from "@/types";

const ZERO_BYTES32 = `0x${"0".repeat(64)}` as const;
const MIN_SQRT_PRICE_PLUS_ONE = 4_295_128_740n;
const MAX_SQRT_PRICE_MINUS_ONE = 1_461_446_703_485_210_103_287_273_052_203_988_822_378_723_970_341n;

function isBytes32(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function parseSignedBigInt(value: string) {
  if (!/^-?\d+$/.test(value.trim())) return undefined;
  return BigInt(value.trim());
}

function parseUnsignedBigInt(value: string) {
  if (!/^\d+$/.test(value.trim())) return undefined;
  return BigInt(value.trim());
}

export function PoolManagerPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switchingChain } = useSwitchChain();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [liquidityDelta, setLiquidityDelta] = useState("1000000000000000000");
  const [tickLower, setTickLower] = useState("-600");
  const [tickUpper, setTickUpper] = useState("600");
  const [liquiditySalt, setLiquiditySalt] = useState<string>(ZERO_BYTES32);
  const [swapAmount, setSwapAmount] = useState("1000");
  const [swapZeroForOne, setSwapZeroForOne] = useState(true);

  const isSepolia = chainId === sepolia.id;
  const canWrite = Boolean(isConnected && isSepolia && addresses.poolRouter);
  const parsedLiquidityDelta = useMemo(() => parseSignedBigInt(liquidityDelta), [liquidityDelta]);
  const parsedTickLower = Number(tickLower);
  const parsedTickUpper = Number(tickUpper);
  const parsedSwapAmount = useMemo(() => parseUnsignedBigInt(swapAmount), [swapAmount]);
  const liquidityValid = parsedLiquidityDelta !== undefined
    && Number.isInteger(parsedTickLower)
    && Number.isInteger(parsedTickUpper)
    && parsedTickLower < parsedTickUpper
    && isBytes32(liquiditySalt);
  const swapValid = parsedSwapAmount !== undefined && parsedSwapAmount > 0n;

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

  async function runPoolAction(action: () => Promise<`0x${string}`>, success: string) {
    if (!isConnected || !address) {
      toast.error("Connect a wallet to use the pool.");
      return;
    }

    if (!addresses.poolRouter) {
      toast.error("Pool router address is not configured.");
      return;
    }

    if (!(await ensureSepolia())) return;

    setPending(true);
    try {
      const hash = await action();
      toast.success(`Submitted pool tx: ${hash.slice(0, 10)}...`);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hook-status"] }),
        queryClient.invalidateQueries({ queryKey: ["markets"] }),
      ]);
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pool transaction failed.");
    } finally {
      setPending(false);
    }
  }

  async function submitModifyLiquidity(multiplier: 1n | -1n) {
    if (!address || !liquidityValid || parsedLiquidityDelta === undefined) return;

    const absoluteDelta = parsedLiquidityDelta < 0n ? -parsedLiquidityDelta : parsedLiquidityDelta;
    await runPoolAction(
      () => modifyHookPoolLiquidity(
        {
          tickLower: parsedTickLower,
          tickUpper: parsedTickUpper,
          liquidityDelta: absoluteDelta * multiplier,
          salt: liquiditySalt as `0x${string}`,
        },
        address as Address,
      ),
      multiplier > 0n ? "Liquidity added." : "Liquidity removed.",
    );
  }

  async function submitPoolSwap() {
    if (!address || !swapValid || parsedSwapAmount === undefined) return;

    await runPoolAction(
      () => swapHookPool(
        {
          zeroForOne: swapZeroForOne,
          amountSpecified: -parsedSwapAmount,
          sqrtPriceLimitX96: swapZeroForOne ? MIN_SQRT_PRICE_PLUS_ONE : MAX_SQRT_PRICE_MINUS_ONE,
        },
        address as Address,
      ),
      "Pool swap submitted.",
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-400">Uniswap v4 hook pool</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">PoolManager actions</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300">
            <Droplets className="size-4 text-sky-300" />
            {addresses.poolRouter ? "Router configured" : "Router missing"}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Router</p>
          <p className="mt-2 break-all text-sm font-medium text-white">{addresses.poolRouter ?? "Not configured"}</p>
        </div>
        <div className="rounded-md bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Token0</p>
          <p className="mt-2 break-all text-sm font-medium text-white">{sepoliaRehypothecationPoolKey.currency0}</p>
        </div>
        <div className="rounded-md bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Token1</p>
          <p className="mt-2 break-all text-sm font-medium text-white">{sepoliaRehypothecationPoolKey.currency1}</p>
        </div>
      </section>

      {!isConnected ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">
          Connect a wallet to submit PoolManager transactions.
        </section>
      ) : !isSepolia ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-amber-100">Switch to Sepolia before submitting pool transactions.</p>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-sky-500 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
              disabled={switchingChain}
              onClick={() => switchChainAsync({ chainId: sepolia.id })}
            >
              {switchingChain ? "Switching..." : "Switch to Sepolia"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-sky-500 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
            disabled={!canWrite || pending}
            onClick={() => runPoolAction(() => initializeHookPool(), "Hook pool initialized.")}
          >
            {pending ? "Submitting..." : "Initialize pool"}
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-semibold text-slate-200 disabled:border-slate-800 disabled:text-slate-600"
            disabled={!canWrite || pending}
            onClick={() => runPoolAction(() => approvePoolRouterToken(sepoliaRehypothecationPoolKey.currency0), "Token0 approval confirmed.")}
          >
            Approve token0
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-semibold text-slate-200 disabled:border-slate-800 disabled:text-slate-600"
            disabled={!canWrite || pending}
            onClick={() => runPoolAction(() => approvePoolRouterToken(sepoliaRehypothecationPoolKey.currency1), "Token1 approval confirmed.")}
          >
            Approve token1
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Liquidity</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Modify pool liquidity</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400" placeholder="Tick lower" value={tickLower} onChange={(event) => setTickLower(event.target.value)} />
            <input className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400" placeholder="Tick upper" value={tickUpper} onChange={(event) => setTickUpper(event.target.value)} />
            <input className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400 sm:col-span-2" placeholder="Liquidity delta" value={liquidityDelta} onChange={(event) => setLiquidityDelta(event.target.value)} />
            <input className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400 sm:col-span-2" placeholder="Salt bytes32" value={liquiditySalt} onChange={(event) => setLiquiditySalt(event.target.value)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400" disabled={!canWrite || !liquidityValid || pending} onClick={() => submitModifyLiquidity(1n)}>
              Add liquidity
            </button>
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-amber-400 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400" disabled={!canWrite || !liquidityValid || pending} onClick={() => submitModifyLiquidity(-1n)}>
              Remove liquidity
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Swap</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Submit pool swap</h2>
          <div className="mt-5 grid gap-3">
            <input className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400" placeholder="Exact input amount" value={swapAmount} onChange={(event) => setSwapAmount(event.target.value)} />
            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-slate-300">
              <input type="checkbox" checked={swapZeroForOne} onChange={(event) => setSwapZeroForOne(event.target.checked)} />
              Swap token0 to token1
            </label>
          </div>
          <button className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400" disabled={!canWrite || !swapValid || pending} onClick={submitPoolSwap}>
            <Wallet className="size-4" />
            Submit pool swap
          </button>
        </section>
      </div>
    </div>
  );
}
