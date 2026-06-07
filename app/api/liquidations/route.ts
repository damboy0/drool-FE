import { NextResponse } from "next/server";
import { getLiquidations } from "@/contracts/liquidations";

export async function GET() {
  const liquidations = await getLiquidations();

  return NextResponse.json(
    liquidations.map((item) => ({
      positionId: item.positionId.toString(),
      marginHealth: item.marginHealth / 100,
      bountyUSD: item.bountyUSD,
      contractAddress: item.contractAddress,
    })),
  );
}
