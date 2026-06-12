import Link from "next/link";
import {
  ArrowRight,
  Activity,
  BadgeDollarSign,
  Droplets,
  Gauge,
  HandCoins,
  PauseCircle,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { LiveNumbersBar } from "@/components/home/live-numbers-bar";

export default function Home() {
  const outcomes = [
    {
      title: "Dual yield",
      body: "Earn Aave supply APY on top of your swap fees. 80% of your deposit works in Aave, 20% stays ready for swaps.",
      icon: HandCoins,
    },
    {
      title: "Automatic rebalancing",
      body: "When a swap needs liquidity, the hook withdraws from Aave instantly. You never miss a trade.",
      icon: Gauge,
    },
    {
      title: "Emergency control",
      body: "Owner can pause the hook or withdraw all Aave funds in one transaction. Full custody, always.",
      icon: ShieldCheck,
    },
  ];

  const actions = [
    { name: "Pool", detail: "Add or remove liquidity and watch your Aave yield accrue in real time." },
    { name: "Admin", detail: "Configure the hook, set Aave mappings, pause operations, emergency withdraw." },
    { name: "Portfolio", detail: "See your positions and how much yield has been generated." },
    { name: "Markets", detail: "Browse active pools with rehypothecation enabled." },
  ];

  const flow = [
    {
      title: "You add liquidity",
      body: "Tokens go into the Uniswap v4 pool.",
      icon: Droplets,
    },
    {
      title: "Hook deposits 80% to Aave",
      body: "Your capital earns Aave yield automatically.",
      icon: HandCoins,
    },
    {
      title: "Swaps execute normally",
      body: "The hook withdraws from Aave only when the pool needs it.",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-10">
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">Drool</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
            Your idle liquidity is leaving money on the table.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Drool is a Uniswap v4 hook that automatically puts idle LP capital to work in Aave, so you earn swap fees
            and yield, simultaneously, with zero extra steps.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pool"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Add liquidity
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See how it works
              <Activity className="size-4" />
            </Link>
          </div>
        </div>

        <div className="relative min-h-[28rem] overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-sky-950/30">
          <div className="absolute inset-x-0 top-0 h-1 bg-sky-400" />
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-slate-400">Capital routing</p>
              <h2 className="mt-1 text-xl font-semibold text-white">One LP deposit, two yield sources</h2>
            </div>
            <BadgeDollarSign className="size-6 text-emerald-300" />
          </div>
          <div className="mt-6 grid gap-4">
            {[
              { label: "Deposited to Aave", value: "80%", tone: "text-emerald-300" },
              { label: "Ready inside pool", value: "20%", tone: "text-sky-300" },
              { label: "Extra LP steps", value: "0", tone: "text-white" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md bg-slate-950 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className={`text-3xl font-semibold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-md bg-slate-950 p-4">
            <p className="text-sm text-slate-400">Hook behavior</p>
            <p className="mt-2 text-lg font-semibold text-white">
              Liquidity stays available for swaps while idle capital keeps earning in Aave.
            </p>
          </div>
        </div>
      </section>

      <LiveNumbersBar />

      <section className="grid gap-4 pb-8 md:grid-cols-3">
        {outcomes.map((item) => {
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

      <section id="how-it-works" className="grid gap-8 py-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">How Drool works</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Idle LP capital moves only when the pool can put it to work.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Drool keeps liquidity usable for swaps while sending the idle portion into Aave in the background.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
          {flow.map((step, index) => {
            const Icon = step.icon;

            return [
              <article key={step.title} className="rounded-lg border border-white/10 bg-slate-900 p-5">
                <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-emerald-300">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-xs font-medium uppercase text-slate-500">Step {index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
              </article>,
              index < flow.length - 1 ? (
                <div key={`${step.title}-arrow`} className="hidden items-center justify-center text-sky-300 sm:flex">
                  <ArrowRight className="size-5" />
                </div>
              ) : null,
            ];
          })}
        </div>
      </section>

      <section className="py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">What you can do</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Manage liquidity, yield, and hook controls.</h2>
          </div>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
          >
            Explore all markets
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {actions.map((action) => (
            <article key={action.name} className="rounded-lg border border-white/10 bg-slate-900 p-5">
              <h3 className="text-lg font-semibold text-white">{action.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{action.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-8 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-900 p-6">
          <WalletCards className="size-6 text-sky-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Your yield stays visible</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Portfolio and pool views are structured for checking active liquidity, accrued yield, and current hook status
            without digging through contracts.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-6">
          <PauseCircle className="size-6 text-emerald-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Operators keep final control</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The admin console exposes configuration, pausing, ownership transfer, and emergency withdrawal for the
            deployed hook.
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-white/10 bg-slate-900 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">Enter the app</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Add liquidity or inspect active rehypothecation pools.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pool"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Add liquidity
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/markets"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse markets
              <Droplets className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
