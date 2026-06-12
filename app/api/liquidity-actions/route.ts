import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import type { Address, Hash, PoolId } from "@/types";
import type { LiquidityActionKind, LiquidityActionRecord } from "@/types/liquidity-action";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "liquidity-actions.json");

function isAddress(value: unknown): value is Address {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isBytes32(value: unknown): value is PoolId {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

function isHash(value: unknown): value is Hash {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

function isAction(value: unknown): value is LiquidityActionKind {
  return value === "add" || value === "remove";
}

function normalizeAddress<T extends Address>(value: T): T {
  return value.toLowerCase() as T;
}

async function readActions(): Promise<LiquidityActionRecord[]> {
  try {
    const contents = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(contents);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeActions(actions: LiquidityActionRecord[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(actions, null, 2)}\n`, "utf8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const wallet = searchParams.get("wallet")?.toLowerCase();
  const hook = searchParams.get("hook")?.toLowerCase();
  const poolId = searchParams.get("poolId")?.toLowerCase();
  const actions = await readActions();

  const filtered = actions
    .filter((item) => !wallet || item.wallet.toLowerCase() === wallet)
    .filter((item) => !hook || item.hook.toLowerCase() === hook)
    .filter((item) => !poolId || item.poolId.toLowerCase() === poolId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 50);

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (
    !body
    || typeof body !== "object"
    || !isAddress(body.wallet)
    || !isAddress(body.hook)
    || !isBytes32(body.poolId)
    || !isHash(body.txHash)
    || !isAction(body.action)
    || typeof body.pair !== "string"
    || typeof body.tickLower !== "number"
    || typeof body.tickUpper !== "number"
    || typeof body.liquidityDelta !== "string"
    || !isBytes32(body.salt)
  ) {
    return NextResponse.json({ error: "Invalid liquidity action payload." }, { status: 400 });
  }

  const actions = await readActions();
  const record: LiquidityActionRecord = {
    id: `${body.txHash}-${body.action}-${Date.now()}`,
    wallet: normalizeAddress(body.wallet),
    hook: normalizeAddress(body.hook),
    poolId: body.poolId.toLowerCase() as PoolId,
    txHash: body.txHash,
    action: body.action,
    pair: body.pair,
    tickLower: body.tickLower,
    tickUpper: body.tickUpper,
    liquidityDelta: body.liquidityDelta,
    salt: body.salt,
    createdAt: new Date().toISOString(),
  };

  const nextActions = [
    record,
    ...actions.filter((item) => !(item.txHash.toLowerCase() === record.txHash.toLowerCase() && item.action === record.action)),
  ].slice(0, 500);

  await writeActions(nextActions);

  return NextResponse.json(record, { status: 201 });
}
