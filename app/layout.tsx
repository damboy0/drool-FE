import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drool Protocol",
  description: "Synthetic interest rate swap marketplace on Uniswap v4.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
