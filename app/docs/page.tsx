const sections = [
  {
    title: "Open a fixed-rate swap",
    body: "Choose a market, enter notional, review the required margin, optionally mint a position NFT, then submit the swap. The fixed side receives the locked fixed APY and pays realized floating.",
  },
  {
    title: "Take the floating side",
    body: "Open orders are listed in each market detail page. The floating receiver posts margin plus liquidation bounty, receives realized Aave floating, and pays the agreed fixed rate.",
  },
  {
    title: "Manage margin",
    body: "Portfolio cards update every block-level polling interval. Add margin before warning and danger thresholds are reached to avoid third-party liquidation.",
  },
  {
    title: "NFT ownership",
    body: "Minted position NFTs represent beneficial ownership of the swap position. Transfers include the position economics and margin obligations.",
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <p className="text-sm text-slate-400">Documentation</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">FixedFlow protocol guide</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          FixedFlow is a synthetic interest-rate swap marketplace for fixed and floating Aave rate exposure.
          This frontend is wired mock-first so contract addresses, ABIs, oracle reads, NFT calls, and subgraph
          endpoints can replace fixtures through the contract and data abstraction layers.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-lg border border-white/10 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{section.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
