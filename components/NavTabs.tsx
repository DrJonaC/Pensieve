"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/guide", label: "Guide" },
  { href: "/user-view", label: "User View" },
  { href: "/surface-model", label: "Surface Model" }
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950/55 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Pensieve</p>
          <p className="mt-1 text-sm text-slate-300">Memory observability and governance</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-cyan-50 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.14]"
        >
          Dashboard Preview
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-3.5 py-2 text-sm transition ${
                isActive
                  ? "bg-cyan-300 text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/25 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
