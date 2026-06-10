"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, PauseCircle, PlayCircle, Shield, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { encodeAbiParameters, isAddress, keccak256 } from "viem";
import { sepolia } from "wagmi/chains";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import {
  emergencyWithdrawHookPool,
  setHookPaused,
  setHookPoolConfig,
} from "@/contracts/aave-liquidity-hook";
import { addresses, sepoliaAaveAssets, sepoliaContracts, sepoliaRehypothecationPoolKey } from "@/contracts/addresses";
import { useHookStatus } from "@/hooks/use-hook-status";
import { wagmiConfig } from "@/lib/wagmi";
import type { Address, PoolId } from "@/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shorten(value?: string) {
  if (!value) return "Not configured";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function isPoolId(value: string): value is PoolId {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function derivePoolId(hook: Address): PoolId {
  return keccak256(
    encodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            { name: "currency0", type: "address" },
            { name: "currency1", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "tickSpacing", type: "int24" },
            { name: "hooks", type: "address" },
          ],
        },
      ],
      [
        {
          currency0: sepoliaRehypothecationPoolKey.currency0,
          currency1: sepoliaRehypothecationPoolKey.currency1,
          fee: sepoliaRehypothecationPoolKey.fee,
          tickSpacing: sepoliaRehypothecationPoolKey.tickSpacing,
          hooks: hook,
        },
      ],
    ),
  ) as PoolId;
}

function Field({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass = tone === "success" ? "text-emerald-300" : tone === "warning" ? "text-amber-300" : "text-white";

  return (
    <div className="rounded-md bg-slate-950 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 break-all text-sm font-medium ${toneClass}`}>{value}</p>
    </div>
  );
}

export function HookAdminPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switchingChain } = useSwitchChain();
  const queryClient = useQueryClient();
  const { data: hookStatus, isLoading, error } = useHookStatus();
  const [pausePending, setPausePending] = useState(false);
  const [poolPending, setPoolPending] = useState(false);
  const [withdrawPending, setWithdrawPending] = useState(false);
  const defaultPoolId = derivePoolId(addresses.hook ?? sepoliaContracts.hook);
  const [poolId, setPoolId] = useState<string>(defaultPoolId);
  const [withdrawPoolId, setWithdrawPoolId] = useState<string>(defaultPoolId);
  const [aToken, setAToken] = useState<string>(sepoliaAaveAssets[0].aToken);
  const [underlying, setUnderlying] = useState<string>(sepoliaAaveAssets[0].underlying);
  const [isToken0, setIsToken0] = useState(true);
  const [withdrawConfirmation, setWithdrawConfirmation] = useState("");

  const owner = hookStatus?.owner;
  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const isSepolia = chainId === sepolia.id;
  const canWrite = Boolean(hookStatus?.configured && isConnected && isOwner && isSepolia);
  const targetPercent = hookStatus ? Number(hookStatus.targetInPoolBps) / 100 : 0;

  const poolConfigValid = useMemo(
    () => isPoolId(poolId) && isAddress(aToken) && isAddress(underlying),
    [aToken, poolId, underlying],
  );
  const emergencyWithdrawValid = isPoolId(withdrawPoolId) && withdrawConfirmation === "WITHDRAW";
  const poolConfigBlockReason = !hookStatus?.configured
    ? "Set NEXT_PUBLIC_HOOK_ADDRESS and restart the dev server."
    : !isConnected
      ? "Connect the owner wallet."
      : !isOwner
        ? "Only the hook owner can submit this transaction."
        : !isSepolia
          ? "Switch to Sepolia."
          : !isPoolId(poolId)
            ? "Enter the PoolId bytes32 for the Uniswap v4 pool."
            : !isAddress(aToken)
              ? "Enter a valid Aave aToken address."
              : !isAddress(underlying)
                ? "Enter a valid underlying token address."
                : undefined;

  function applyAssetPreset(symbol: "LINK" | "WETH") {
    const preset = sepoliaAaveAssets.find((asset) => asset.symbol === symbol);
    if (!preset) return;

    setAToken(preset.aToken);
    setUnderlying(preset.underlying);
    setIsToken0(preset.symbol === "WETH");
  }

  function applyScriptPoolDefaults() {
    setPoolId(defaultPoolId);
    setWithdrawPoolId(defaultPoolId);
    applyAssetPreset("WETH");
  }

  async function refreshHookStatus() {
    await queryClient.invalidateQueries({ queryKey: ["hook-status"] });
  }

  async function runPauseToggle(nextPaused: boolean) {
    if (!canWrite) return;

    setPausePending(true);
    try {
      const hash = await setHookPaused(nextPaused);
      toast.success(`Submitted ${nextPaused ? "pause" : "unpause"} tx: ${hash.slice(0, 10)}...`);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      await refreshHookStatus();
      toast.success(`Hook ${nextPaused ? "paused" : "unpaused"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pause transaction failed.");
    } finally {
      setPausePending(false);
    }
  }

  async function submitPoolConfig() {
    if (!canWrite || !poolConfigValid) return;

    setPoolPending(true);
    try {
      const hash = await setHookPoolConfig(poolId as PoolId, aToken as Address, underlying as Address, isToken0);
      toast.success(`Submitted pool config tx: ${hash.slice(0, 10)}...`);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      await queryClient.invalidateQueries({ queryKey: ["hook-pool-config", poolId] });
      toast.success("Pool config updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pool config transaction failed.");
    } finally {
      setPoolPending(false);
    }
  }

  async function submitEmergencyWithdraw() {
    if (!canWrite || !emergencyWithdrawValid) return;

    setWithdrawPending(true);
    try {
      const hash = await emergencyWithdrawHookPool(withdrawPoolId as PoolId);
      toast.success(`Submitted emergency withdraw tx: ${hash.slice(0, 10)}...`);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      await refreshHookStatus();
      toast.success("Emergency withdraw completed.");
      setWithdrawConfirmation("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Emergency withdraw transaction failed.");
    } finally {
      setWithdrawPending(false);
    }
  }

  if (isLoading) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading hook admin...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-400">Owner console</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Aave hook admin</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <Shield className="size-4 text-sky-300" />
              {hookStatus?.configured ? "Hook configured" : "Hook missing"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <Wallet className="size-4 text-amber-300" />
              {isOwner ? "Owner connected" : "Read only"}
            </span>
          </div>
        </div>
        {error ? (
          <p className="mt-4 rounded-md border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
            {error instanceof Error ? error.message : "Failed to load hook status."}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Hook address" value={addresses.hook ?? "NEXT_PUBLIC_HOOK_ADDRESS not configured"} />
        <Field label="Owner" value={owner ?? ZERO_ADDRESS} tone={isOwner ? "success" : "default"} />
        <Field label="Connected wallet" value={address ?? "Not connected"} tone={isOwner ? "success" : "warning"} />
        <Field label="Status" value={hookStatus?.paused ? "Paused" : "Live"} tone={hookStatus?.paused ? "warning" : "success"} />
        <Field label="Target in pool" value={`${targetPercent.toFixed(0)}%`} />
        <Field label="Network" value={isSepolia ? "Sepolia" : `Wrong network (${chainId})`} tone={isSepolia ? "success" : "warning"} />
        <Field label="Aave Pool" value={hookStatus?.aavePool ?? sepoliaContracts.aavePool} />
        <Field label="PoolManager" value={hookStatus?.poolManager ?? sepoliaContracts.poolManager} />
        <Field label="Permissions" value={hookStatus?.permissions ? "Loaded from contract" : "Unavailable"} />
      </section>

      {!hookStatus?.configured ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">
          Set `NEXT_PUBLIC_HOOK_ADDRESS` and restart the dev server before using admin actions.
        </section>
      ) : !isConnected ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">
          Connect the owner wallet to enable admin actions.
        </section>
      ) : !isOwner ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">
          Connected wallet `{shorten(address)}` does not match owner `{shorten(owner)}`. Admin actions are disabled.
        </section>
      ) : !isSepolia ? (
        <section className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-amber-100">Switch to Sepolia before submitting admin transactions.</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Pause control</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Hook availability</h2>
            </div>
            {hookStatus?.paused ? <PauseCircle className="size-5 text-amber-300" /> : <CheckCircle2 className="size-5 text-emerald-300" />}
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Pausing blocks hook-sensitive operations until the owner unpauses the contract.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-amber-400 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
              disabled={!canWrite || pausePending || hookStatus?.paused}
              onClick={() => runPauseToggle(true)}
            >
              <PauseCircle className="size-4" />
              {pausePending ? "Submitting..." : "Pause"}
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
              disabled={!canWrite || pausePending || !hookStatus?.paused}
              onClick={() => runPauseToggle(false)}
            >
              <PlayCircle className="size-4" />
              {pausePending ? "Submitting..." : "Unpause"}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
          <div>
            <p className="text-sm text-slate-400">Pool config</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Set Aave deployment mapping</h2>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-md border border-white/10 bg-slate-950 p-3">
              <div className="grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                <div>
                  <p>Pool key</p>
                  <p className="mt-1 font-medium text-white">WETH / LINK · 0.3% · 60</p>
                </div>
                <div>
                  <p>Derived PoolId</p>
                  <p className="mt-1 break-all font-medium text-white">{defaultPoolId}</p>
                </div>
              </div>
              <button
                className="mt-3 h-9 rounded-md border border-white/10 px-3 text-sm font-medium text-slate-200 transition hover:border-sky-400 hover:text-white"
                onClick={applyScriptPoolDefaults}
                type="button"
              >
                Use script defaults
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sepoliaAaveAssets.map((asset) => {
                const active = aToken.toLowerCase() === asset.aToken.toLowerCase()
                  && underlying.toLowerCase() === asset.underlying.toLowerCase();

                return (
                  <button
                    key={asset.symbol}
                    className={`h-10 rounded-md border px-3 text-sm font-medium transition ${
                      active
                        ? "border-sky-400 bg-sky-500 text-slate-950"
                        : "border-white/10 bg-slate-950 text-slate-300 hover:border-sky-400"
                    }`}
                    onClick={() => applyAssetPreset(asset.symbol)}
                    type="button"
                  >
                    {asset.symbol}
                  </button>
                );
              })}
            </div>
            <input
              className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400"
              placeholder="PoolId bytes32"
              value={poolId}
              onChange={(event) => setPoolId(event.target.value)}
            />
            <input
              className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400"
              placeholder="Aave aToken address"
              value={aToken}
              onChange={(event) => setAToken(event.target.value)}
            />
            <input
              className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400"
              placeholder="Underlying ERC20 address"
              value={underlying}
              onChange={(event) => setUnderlying(event.target.value)}
            />
            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={isToken0}
                onChange={(event) => setIsToken0(event.target.checked)}
              />
              Underlying is token0
            </label>
          </div>
          {poolConfigBlockReason ? (
            <p className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
              {poolConfigBlockReason}
            </p>
          ) : null}
          <button
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-sky-500 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
            disabled={Boolean(poolConfigBlockReason) || !poolConfigValid || poolPending}
            onClick={submitPoolConfig}
          >
            {poolPending ? "Submitting..." : "Set pool config"}
          </button>
        </section>
      </div>

      <section className="rounded-lg border border-red-400/20 bg-red-400/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 text-red-300" />
          <div>
            <p className="text-sm text-red-200">Emergency action</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Withdraw all from Aave for a pool</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            className="h-10 rounded-md border border-red-300/20 bg-slate-950 px-3 text-sm text-white outline-none focus:border-red-300"
            placeholder="PoolId bytes32"
            value={withdrawPoolId}
            onChange={(event) => setWithdrawPoolId(event.target.value)}
          />
          <input
            className="h-10 rounded-md border border-red-300/20 bg-slate-950 px-3 text-sm text-white outline-none focus:border-red-300"
            placeholder="Type WITHDRAW"
            value={withdrawConfirmation}
            onChange={(event) => setWithdrawConfirmation(event.target.value)}
          />
        </div>
        <button
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-red-400 px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
          disabled={!canWrite || !emergencyWithdrawValid || withdrawPending}
          onClick={submitEmergencyWithdraw}
        >
          {withdrawPending ? "Submitting..." : "Emergency withdraw"}
        </button>
      </section>
    </div>
  );
}
