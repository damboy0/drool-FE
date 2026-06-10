"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, GalleryHorizontal, Home, LayoutDashboard, Shield, ShieldAlert, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/nft-gallery", label: "NFTs", icon: GalleryHorizontal },
  { href: "/liquidations", label: "Liquidations", icon: ShieldAlert },
  { href: "/admin/hook", label: "Admin", icon: Shield },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-sky-500 text-sm font-black text-slate-950">
            DR
          </span>
          <span className="hidden text-base font-semibold text-white sm:block">Drool</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white",
                  active && "bg-white/10 text-white",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <ConnectButton chainStatus="icon" accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} />
      </div>
    </header>
  );
}
