import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BenchBridge",
  description: "Buildings are waiting. Workers are waiting. People are waiting for housing.",
};

const links = [
  ["/", "Map"],
  ["/workforce", "Bench"],
  ["/scenario", "What if"],
  ["/methodology", "Methodology"],
  ["/demo", "Judge mode"],
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="flex items-center justify-between border-b border-line px-4 py-2">
          <Link href="/" className="font-display text-2xl uppercase tracking-wide">BenchBridge</Link>
          <nav className="flex gap-4 text-[11px] uppercase tracking-[0.16em] text-steel">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-paper">{label}</Link>
            ))}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
