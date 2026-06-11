import { readContract, writeContract } from "wagmi/actions";
import { aaveLiquidityHookAbi } from "@/contracts/abis/aave-liquidity-hook";
import { addresses } from "@/contracts/addresses";
import { wagmiConfig } from "@/lib/wagmi";
import type { Address, Hash, HookPermissions, HookStatus, PoolConfig, PoolId } from "@/types";

function getHookAddress(): Address {
  if (!addresses.hook) {
    throw new Error("NEXT_PUBLIC_HOOK_ADDRESS is not configured.");
  }

  return addresses.hook;
}

export function hasHookContract() {
  return Boolean(addresses.hook);
}

export async function getHookStatus(): Promise<HookStatus> {
  if (!hasHookContract()) {
    return {
      configured: false,
      paused: false,
      targetInPoolBps: 0n,
      aavePool: undefined,
      poolManager: undefined,
      owner: undefined,
      permissions: undefined,
    };
  }

  const address = getHookAddress();
  const [paused, targetInPoolBps, aavePool, poolManager, owner, permissions] = await Promise.all([
    readContract(wagmiConfig, { address, abi: aaveLiquidityHookAbi, functionName: "paused" }),
    readContract(wagmiConfig, { address, abi: aaveLiquidityHookAbi, functionName: "TARGET_IN_POOL_BPS" }),
    readContract(wagmiConfig, { address, abi: aaveLiquidityHookAbi, functionName: "aavePool" }),
    readContract(wagmiConfig, { address, abi: aaveLiquidityHookAbi, functionName: "poolManager" }),
    readContract(wagmiConfig, { address, abi: aaveLiquidityHookAbi, functionName: "owner" }),
    readContract(wagmiConfig, { address, abi: aaveLiquidityHookAbi, functionName: "getHookPermissions" }),
  ]);

  return {
    configured: true,
    paused,
    targetInPoolBps,
    aavePool,
    poolManager,
    owner,
    permissions: permissions as HookPermissions,
  };
}

export async function getPoolConfig(poolId: PoolId): Promise<PoolConfig> {
  const result = await readContract(wagmiConfig, {
    address: getHookAddress(),
    abi: aaveLiquidityHookAbi,
    functionName: "poolConfigs",
    args: [poolId],
  });

  const [aToken, underlying, deployedToAave, isToken0, initialized] = result;

  return {
    aToken,
    underlying,
    deployedToAave,
    isToken0,
    initialized,
  };
}

export async function setHookPaused(paused: boolean): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getHookAddress(),
    abi: aaveLiquidityHookAbi,
    functionName: "setPaused",
    args: [paused],
  });
}

export async function setHookPoolConfig(
  poolId: PoolId,
  aToken: Address,
  underlying: Address,
  isToken0: boolean,
): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getHookAddress(),
    abi: aaveLiquidityHookAbi,
    functionName: "setPoolConfig",
    args: [poolId, aToken, underlying, isToken0],
  });
}

export async function emergencyWithdrawHookPool(poolId: PoolId): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getHookAddress(),
    abi: aaveLiquidityHookAbi,
    functionName: "emergencyWithdrawAll",
    args: [poolId],
  });
}

export async function transferHookOwnership(newOwner: Address): Promise<Hash> {
  return writeContract(wagmiConfig, {
    address: getHookAddress(),
    abi: aaveLiquidityHookAbi,
    functionName: "transferOwnership",
    args: [newOwner],
  });
}
