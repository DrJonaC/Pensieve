"use client";

import { useLocale } from "@/lib/locale";

import { useState } from "react";
import { MemoryActionBar } from "@/components/dashboard/MemoryActionBar";
import { type DashboardMemoryRecord } from "@/lib/pensieve-dashboard-core";
import { presentDashboardMemoryItem } from "@/lib/pensieve-memory-item-presenter";
import { getGovernedMemoryDisplay } from "@/lib/pensieve-governance";

type MemoryListPanelProps = {
  memories: DashboardMemoryRecord[];
  expanded: boolean;
  pendingActionId: string | null;
  selectedMemoryId: string | null;
  onSelect: (memoryId: string) => void;
  onPin: (memoryId: string, value: boolean) => void;
  onSoften: (memoryId: string, value: boolean) => void;
  onHide: (memoryId: string) => void;
  onRestore: (memoryId: string) => void;
};

const riskClasses: Record<DashboardMemoryRecord["risk_level"], string> = {
  low: "bg-[rgba(134,170,153,0.18)] text-[rgb(72,105,91)]",
  medium: "bg-[rgba(166,179,160,0.24)] text-[rgb(98,108,92)]",
  high: "bg-[rgba(182,150,145,0.25)] text-[rgb(116,79,74)]"
};
export function MemoryListPanel({
  memories,
  expanded,
  pendingActionId,
  selectedMemoryId,
  onSelect,
  onPin,
  onSoften,
  onHide,
  onRestore
}: MemoryListPanelProps) {
  const { ui, t, language } = useLocale();
  const sectionLabel = expanded ? "Structured fragments and controls" : "Top memory fragments";
  const [hideIntentId, setHideIntentId] = useState<string | null>(null);

  return (
    <section className="dashboard-panel rounded-[1.45rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="dashboard-kicker">{ui("Memory List")}</p>
          <h3 className="dashboard-section-title mt-1">{ui(sectionLabel)}</h3>
          <p className="dashboard-subcopy mt-2">
            {expanded
              ? ui("Inspect fragment detail, recency, and direct governance controls.")
              : ui("A ranked overview of the fragments currently staying most present.")}
          </p>
        </div>
        <span className="dashboard-meta-note">{memories.length} {ui("entries")}</span>
      </div>

      <div className="mt-4 space-y-3">
        {memories.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-[rgba(122,150,144,0.24)] bg-white/60 px-4 py-4">
            <p className="dashboard-meta-note">{ui("Empty field")}</p>
            <p className="dashboard-empty-copy mt-2">
              {ui("No visible memories are currently active. Restore hidden traces or wait for new memory input from the host.")}
            </p>
          </div>
        ) : null}

        {memories.map((memory) => {
          const isSelected = selectedMemoryId === memory.id;
          const isPending = pendingActionId === memory.id;
          const isHidden = memory.status === "hidden";
          const governed = getGovernedMemoryDisplay(memory);
          const presented = presentDashboardMemoryItem(memory, governed);
          const isHideConfirming = hideIntentId === memory.id;

          return (
            <article
              key={memory.id}
              className={`dashboard-memory-row rounded-[1.2rem] border transition ${
                isSelected
                  ? "border-[rgba(97,141,134,0.35)] bg-[rgba(214,226,221,0.92)]"
                  : "border-[rgba(111,142,136,0.18)] bg-white/72 hover:border-[rgba(97,141,134,0.28)]"
              } ${expanded ? "px-4 py-4" : "px-3 py-3"} ${isHidden ? "opacity-75" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelect(memory.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="dashboard-meta-note">
                        {ui(presented.statusLabel)}
                      </span>
                      <span className="rounded-full bg-[rgba(201,214,210,0.7)] px-2 py-0.5 text-[11px] text-[rgb(79,102,97)]">
                        {ui(presented.governanceTierLabel ?? "")}
                      </span>
                      {presented.pinned ? (
                        <span className="rounded-full bg-[rgba(118,161,153,0.18)] px-2 py-0.5 text-[11px] text-[rgb(73,109,102)]">
                          {ui("pinned")}
                        </span>
                      ) : null}
                    </div>
                    <h4
                      className={`mt-2 line-clamp-2 leading-6 text-slate-900 ${
                        expanded ? "text-[1.02rem] font-semibold tracking-[-0.01em]" : "text-sm font-medium"
                      }`}
                    >
                      {governed.tier === "protected"
                        ? t(presented.title, `受保护的${ui(memory.info_type ?? (memory.origin_tp === "confidentiality" ? "Confidentiality" : memory.risk_level))}记忆`)
                        : presented.title}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${riskClasses[memory.risk_level]}`}>
                      {ui(presented.riskLabel)}
                    </span>
                    <span className="dashboard-meta-note">{presented.scorePercent}%</span>
                  </div>
                </div>
              </button>

              {expanded ? (
                <div className="mt-4 space-y-4">
                  <p className="rounded-[0.95rem] bg-[rgba(236,241,239,0.76)] px-3 py-2 text-[12px] text-slate-600">
                    {ui("Showing a")} {ui(governed.tier_label.toLowerCase())} {ui("based on risk, origin, and memory type.")}
                  </p>

                  <div className="h-1.5 rounded-full bg-[rgba(128,146,141,0.18)]">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-[rgb(127,164,154)] to-[rgb(141,176,170)]"
                      style={{ width: `${presented.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {presented.keywords.slice(0, 6).map((keyword) => (
                      <span key={`${memory.id}-${keyword}`} className="dashboard-chip">
                        {governed.tier === "protected" ? ui(keyword) : keyword}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-2 text-[12px] text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[0.95rem] bg-white/75 px-3 py-2">
                      <p className="dashboard-meta-note">{ui("Activated")}</p>
                      <p className="mt-1 text-sm text-slate-900">{memory.last_activated ? new Date(memory.last_activated).toLocaleDateString(language, { month: "short", day: "numeric" }) : ui("Not yet")}</p>
                    </div>
                    <div className="rounded-[0.95rem] bg-white/75 px-3 py-2">
                      <p className="dashboard-meta-note">{ui("Count")}</p>
                      <p className="mt-1 text-sm text-slate-900">{presented.activationCount}</p>
                    </div>
                    <div className="rounded-[0.95rem] bg-white/75 px-3 py-2">
                      <p className="dashboard-meta-note">{ui("Type")}</p>
                      <p className="mt-1 text-sm capitalize text-slate-900">{ui(presented.infoTypeLabel ?? "")}</p>
                    </div>
                    <div className="rounded-[0.95rem] bg-white/75 px-3 py-2">
                      <p className="dashboard-meta-note">{ui("Source")}</p>
                      <p className="mt-1 text-sm capitalize text-slate-900">{ui(presented.sourceLabel ?? "")}</p>
                    </div>
                  </div>

                  <div className="dashboard-memory-actions rounded-[1rem] border border-[rgba(113,149,142,0.18)] bg-[rgba(228,236,233,0.62)] p-3">
                    <p className="dashboard-meta-note">{ui("Actions")}</p>
                    <div className="mt-3">
                      <MemoryActionBar
                        canRestore={memory.status === "hidden"}
                        isPinned={memory.pinned}
                        isSoftened={memory.status === "softened"}
                        isPending={isPending}
                        onPin={() => onPin(memory.id, !memory.pinned)}
                        onSoften={() => onSoften(memory.id, memory.status !== "softened")}
                        onHide={() => setHideIntentId(memory.id)}
                        onRestore={() => {
                          setHideIntentId(null);
                          onRestore(memory.id);
                        }}
                      />
                    </div>
                  </div>

                  {memory.status !== "hidden" && isHideConfirming ? (
                    <div className="rounded-[1rem] border border-[rgba(160,136,128,0.2)] bg-[rgba(248,244,242,0.88)] p-3">
                      <p className="dashboard-meta-note">
                        {governed.hide_confirmation_tier === "strong" ? ui("Strong confirm") : ui("Confirm")}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgb(89,83,79)]">
                        {governed.hide_confirmation_tier === "strong"
                          ? t("Hide this protected memory from retrieval? The record remains stored. Permanent deletion is available in Memory Library.", "隐藏这条受保护记忆，使其不再被检索？原始记录仍会保留。如需永久删除，请前往记忆库。")
                          : t("Hide this memory from the active field? You can restore it later.", "隐藏这条记忆，使其不再被检索？之后可以恢复。")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="dashboard-action-button"
                          disabled={isPending}
                          onClick={() => {
                            setHideIntentId(null);
                            onHide(memory.id);
                          }}
                        >
                          {ui("Confirm Hide")}
                        </button>
                        <button
                          type="button"
                          className="dashboard-action-button"
                          disabled={isPending}
                          onClick={() => setHideIntentId(null)}
                        >
                          {ui("Cancel")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
