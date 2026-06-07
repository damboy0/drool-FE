"use client";

import Link from "next/link";
import { ExternalLink, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { transferPositionNFT } from "@/contracts/nft";
import { usePositionNFTs } from "@/hooks/use-nfts";
import { cn } from "@/lib/utils";
import type { Address, PositionNFT } from "@/types";

function NFTCard({ nft }: { nft: PositionNFT }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("0x3333333333333333333333333333333333333333");
  const [pending, setPending] = useState(false);
  const svgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(nft.svg)}`;

  async function submitTransfer() {
    if (!address) {
      toast.error("Connect a wallet to transfer this NFT.");
      return;
    }

    setPending(true);
    try {
      const recipient = to.endsWith(".eth") ? "0x3333333333333333333333333333333333333333" : to;
      const hash = await transferPositionNFT(nft.tokenId, address as Address, recipient as Address);
      toast.success(`NFT transfer submitted: ${hash.slice(0, 10)}...`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["position-nfts"] }),
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
      ]);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="group rounded-lg border border-white/10 bg-slate-900 p-3">
      <div className="overflow-hidden rounded-md bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgSrc} alt={`Position NFT ${nft.tokenId.toString()}`} className="aspect-[420/260] w-full object-cover" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Position NFT #{nft.tokenId.toString()}</h2>
          <p className="mt-1 text-sm text-slate-400">{nft.marketId}</p>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">Active</span>
      </div>
      <div className="mt-4 flex gap-2 opacity-100">
        <Link href="/portfolio" className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
          <ExternalLink className="size-4" /> View
        </Link>
        <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950" onClick={() => setOpen(true)}>
          <Send className="size-4" /> Transfer
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Transfer position NFT</h3>
            <p className="mt-3 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">Transferring this NFT transfers full ownership of the swap position, including margin obligations.</p>
            <label className="mt-4 block text-sm text-slate-300" htmlFor={`transfer-${nft.tokenId.toString()}`}>Recipient address or ENS</label>
            <input
              id={`transfer-${nft.tokenId.toString()}`}
              className="mt-2 h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-white"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">Mock ENS names resolve to a deterministic preview address.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)}>Cancel</button>
              <button className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700" disabled={pending} onClick={submitTransfer}>
                {pending ? "Transferring..." : "Confirm transfer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function NFTGalleryPage() {
  const { data: nfts = [], isLoading } = usePositionNFTs();
  const [filter, setFilter] = useState("mine");
  const [market, setMarket] = useState("all");

  const filtered = useMemo(() => {
    return nfts.filter((nft) => market === "all" || nft.marketId === market);
  }, [market, nfts]);

  if (isLoading) {
    return <div className="rounded-lg border border-white/10 bg-slate-900 p-6 text-slate-300">Loading NFTs...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-400">NFT gallery</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Tokenized swap positions</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {["mine", "all"].map((item) => (
              <button key={item} className={cn("rounded-md px-3 py-2 text-sm capitalize", filter === item ? "bg-sky-500 text-slate-950" : "bg-slate-950 text-slate-300")} onClick={() => setFilter(item)}>
                {item === "mine" ? "My NFTs" : "All NFTs"}
              </button>
            ))}
            <select className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" value={market} onChange={(event) => setMarket(event.target.value)}>
              <option value="all">All markets</option>
              <option value="usdc-90d">USDC</option>
              <option value="dai-120d">DAI</option>
              <option value="weth-60d">WETH</option>
            </select>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((nft) => <NFTCard key={nft.tokenId.toString()} nft={nft} />)}
      </div>
    </div>
  );
}
