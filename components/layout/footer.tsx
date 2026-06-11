import Link from "next/link";
import { Code2, ShieldCheck } from "lucide-react";

const links = [
  { href: "/markets", label: "Markets" },
  { href: "/pool", label: "Pool" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-sky-500 text-sm font-black text-slate-950">
              DR
            </span>
            <span className="text-base font-semibold text-white">Drool</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Synthetic fixed and floating interest-rate exposure, hook pool operations, portfolio monitoring, and
            liquidation workflows in one DeFi workspace.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="text-sm font-semibold text-white">Platform</h2>
          <div className="mt-4 grid gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-slate-400 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-white">Resources</h2>
          <div className="mt-4 grid gap-3">
            <Link
              href="/liquidations"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ShieldCheck className="size-4" />
              Liquidations
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <Code2 className="size-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>(c) 2026 Drool. Mock-first protocol interface.</p>
          <p>Built for synthetic interest-rate swap workflows.</p>
        </div>
      </div>
    </footer>
  );
}
