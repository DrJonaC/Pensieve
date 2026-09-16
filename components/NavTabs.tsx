"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale";

const tabs = [
  { href: "/", label: "Home", zh: "首页" },
  { href: "/memories", label: "Memory Library", zh: "记忆管理" },
  { href: "/guide", label: "Guide", zh: "使用指南" },
  { href: "/user-view", label: "User View", zh: "用户视图" },
  { href: "/surface-model", label: "Surface Model", zh: "模型视图" }
];

export function NavTabs() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLocale();

  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950/55 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Pensieve</p>
          <p className="mt-1 text-sm text-slate-300">{t("Memory observability and governance", "看见、理解并管理你的记忆")}</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-cyan-50 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.14]"
        >
          {t("Dashboard Preview", "仪表盘预览")}
        </Link>
        <label className="text-sm text-slate-200">
          <span className="sr-only">{t("Interface language", "界面语言")}</span>
          <select value={language} onChange={e => setLanguage(e.target.value as "en" | "zh-CN")} className="rounded-lg border border-white/20 bg-slate-900 p-2">
            <option value="en">English</option><option value="zh-CN">简体中文</option>
          </select>
        </label>
      </div>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm transition ${
                isActive
                  ? "bg-cyan-300 text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/25 hover:bg-white/10"
              }`}
            >
              {t(tab.label, tab.zh)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
