import { MarketDetail } from "@/components/markets/market-detail";

export default function MarketDetailPage({ params }: { params: { id: string } }) {
  return <MarketDetail marketId={params.id} />;
}
