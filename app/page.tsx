import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Clock,
  GalleryHorizontal,
  Layers3,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

export default function Home() {
  const stats = [
    { label: "Mock notional routed", value: "$42.8M" },
    { label: "Active markets", value: "6" },
    { label: "Position NFTs", value: "124" },
  ];

  const workflows = [
    {
      title: "Trade fixed and floating exposure",
      body: "Compare Aave floating rates against quoted fixed terms before opening a swap.",
      icon: BarChart3,
    },
    {
      title: "Manage positions from one place",
      body: "Track margin health, top up collateral, and review portfolio obligations.",
      icon: WalletCards,
    },
    {
      title: "Liquidate unhealthy swaps",
      body: "Scan eligible positions and submit liquidations with estimated bounty economics.",
      icon: ShieldCheck,
    },
    {
      title: "Mint position ownership",
      body: "Use NFTs to represent beneficial ownership of swap economics and margin.",
      icon: GalleryHorizontal,
    },
  ];

  const markets = [
    { asset: "ETH", term: "90 days", floating: "4.82%", fixed: "5.16%", liquidity: "$12.4M" },
    { asset: "USDC", term: "180 days", floating: "5.21%", fixed: "5.48%", liquidity: "$18.7M" },
    { asset: "WBTC", term: "365 days", floating: "3.76%", fixed: "4.05%", liquidity: "$7.9M" },
  ];

  return (
    <div className="space-y-10">
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">Interest-rate swaps</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
            Drool
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Trade synthetic fixed and floating Aave rate exposure, manage margin, and mint position NFTs from a
            mock-first DeFi workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Open dashboard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/markets"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View markets
              <BarChart3 className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="border-l border-white/15 pl-4">
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[28rem] overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-sky-950/30">
          <div className="absolute inset-x-0 top-0 h-1 bg-sky-400" />
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-slate-400">Market snapshot</p>
              <h2 className="mt-1 text-xl font-semibold text-white">ETH 90-day term</h2>
            </div>
            <BadgeDollarSign className="size-6 text-emerald-300" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Floating</p>
              <p className="mt-2 text-3xl font-semibold text-amber-300">4.82%</p>
            </div>
            <div className="rounded-md bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Fixed offered</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">5.16%</p>
            </div>
          </div>
          <div className="mt-8 h-44">
            <div className="flex h-full items-end gap-2">
              {[38, 56, 48, 64, 72, 61, 78, 84, 69, 88, 76, 92].map((height, index) => (
                <div key={index} className="flex flex-1 items-end rounded-sm bg-slate-950">
                  <div
                    className="w-full rounded-sm bg-sky-400"
                    style={{ height: `${height}%` }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-md bg-slate-950 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Utilization</span>
              <span className="font-medium text-white">72%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-[72%] rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-8 md:grid-cols-2 xl:grid-cols-4">
        {workflows.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="rounded-lg border border-white/10 bg-slate-900 p-5">
              <Icon className="size-5 text-sky-300" />
              <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-8 py-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">How Drool works</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Built around the full lifecycle of a rate position.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            The app separates market discovery, swap execution, collateral management, NFT ownership, and liquidation
            monitoring so each workflow stays focused.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Quote",
              body: "Review the quoted fixed side against the latest floating-rate history.",
              icon: BarChart3,
            },
            {
              title: "Open",
              body: "Enter notional, term, leverage, and margin before submitting a swap.",
              icon: Layers3,
            },
            {
              title: "Maintain",
              body: "Watch margin health and respond before liquidation thresholds are reached.",
              icon: ShieldCheck,
            },
          ].map((step) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="rounded-lg border border-white/10 bg-slate-900 p-5">
                <Icon className="size-5 text-emerald-300" />
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">Featured markets</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Active terms at a glance</h2>
          </div>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
          >
            Explore all markets
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-slate-900">
          <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1fr] border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.16em] text-slate-500 md:grid">
            <span>Asset</span>
            <span>Term</span>
            <span>Floating</span>
            <span>Fixed offered</span>
            <span>Liquidity</span>
          </div>
          {markets.map((market) => (
            <div
              key={`${market.asset}-${market.term}`}
              className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_1fr_1fr_1fr_1fr]"
            >
              <div>
                <p className="text-xs text-slate-500 md:hidden">Asset</p>
                <p className="font-semibold text-white">{market.asset}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 md:hidden">Term</p>
                <p className="text-slate-300">{market.term}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 md:hidden">Floating</p>
                <p className="text-amber-300">{market.floating}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 md:hidden">Fixed offered</p>
                <p className="text-emerald-300">{market.fixed}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 md:hidden">Liquidity</p>
                <p className="text-slate-300">{market.liquidity}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-8 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-900 p-6">
          <Clock className="size-6 text-sky-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Designed for repeated monitoring</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Portfolio views, liquidation tables, and market detail screens are structured for fast scanning rather than
            one-off demos. Drool keeps the current action clear once a position is open.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-6">
          <GalleryHorizontal className="size-6 text-emerald-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Position NFTs stay first-class</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Minted swaps can be browsed in the NFT gallery, inspected for economics, and treated as ownership records
            for the position lifecycle.
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-white/10 bg-slate-900 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">Enter the app</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Start from the dashboard or jump into markets.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Open dashboard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View portfolio
              <WalletCards className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
