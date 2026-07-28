"use client";

import { NavTabs } from "@/components/NavTabs";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="plugin-stage bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#07111f_42%,_#081426_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_80%_8%,rgba(56,189,248,0.08),transparent_16%)]" aria-hidden="true" />
      <div className="relative z-10 mx-auto min-h-screen max-w-7xl px-4 py-5 md:px-6 md:py-6">
        <div className="space-y-5">
          <NavTabs />
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
