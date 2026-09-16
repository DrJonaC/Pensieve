import { type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";
import { getGovernedMemoryDisplay } from "./pensieve-governance.ts";
import { redactSensitiveText } from "./privacy.ts";

export const GOVERNANCE_REPORT_SCHEMA_VERSION = "1.0" as const;

export type GovernanceMemoryState = {
  memory_id: string;
  pinned: boolean;
  status: DashboardMemoryRecord["status"];
};

export type GovernanceCommand =
  | "pin"
  | "unpin"
  | "soften"
  | "unsoften"
  | "hide"
  | "restore";

export type GovernanceChange = {
  memory_id: string;
  content: string;
  risk_level: DashboardMemoryRecord["risk_level"];
  commands: GovernanceCommand[];
  before: GovernanceMemoryState;
  after: GovernanceMemoryState;
  reason: string;
};

export type GovernanceReport = {
  schema_version: typeof GOVERNANCE_REPORT_SCHEMA_VERSION;
  report_id: string;
  previous_report_id: string | null;
  created_at: string;
  source: {
    product: "pensieve";
    provider: string;
    mode: "query-free";
  };
  status: "ready";
  changes: GovernanceChange[];
  resulting_state: GovernanceMemoryState[];
};

export type GovernanceReportArtifact = {
  report: GovernanceReport;
  markdown: string;
  markdown_path: string;
  manifest_path: string;
};

export type GovernanceReceiptItem = {
  memory_id: string;
  status: "verified" | "drifted" | "missing";
  expected: GovernanceMemoryState;
  actual?: GovernanceMemoryState;
};

export type GovernanceReceipt = {
  receipt_id: string;
  report_id: string;
  verified_at: string;
  status: "verified" | "drifted";
  items: GovernanceReceiptItem[];
};

export type GovernanceBridgeStatus = {
  pending_change_count: number;
  latest_report: GovernanceReport | null;
  latest_receipt: GovernanceReceipt | null;
};

type CreateGovernanceReportInput = {
  reportId: string;
  createdAt: string;
  provider: string;
  currentMemories: readonly DashboardMemoryRecord[];
  baselineMemories: readonly DashboardMemoryRecord[];
  previousReport?: GovernanceReport | null;
};

function toGovernanceState(memory: DashboardMemoryRecord): GovernanceMemoryState {
  return {
    memory_id: memory.id,
    pinned: memory.pinned,
    status: memory.status
  };
}

function statesMatch(left: GovernanceMemoryState, right: GovernanceMemoryState): boolean {
  return left.memory_id === right.memory_id && left.pinned === right.pinned && left.status === right.status;
}

function resolveBaselineState(
  memories: readonly DashboardMemoryRecord[],
  previousReport?: GovernanceReport | null
): Map<string, GovernanceMemoryState> {
  const states = previousReport?.resulting_state ?? memories.map(toGovernanceState);
  return new Map(states.map((state) => [state.memory_id, state]));
}

function deriveCommands(
  before: GovernanceMemoryState,
  after: GovernanceMemoryState
): GovernanceCommand[] {
  const commands: GovernanceCommand[] = [];

  if (before.pinned !== after.pinned) {
    commands.push(after.pinned ? "pin" : "unpin");
  }

  if (before.status !== after.status) {
    if (after.status === "hidden") {
      commands.push("hide");
    } else if (after.status === "softened") {
      commands.push("soften");
    } else if (before.status === "hidden") {
      commands.push("restore");
    } else {
      commands.push("unsoften");
    }
  }

  return commands;
}

function buildReason(commands: readonly GovernanceCommand[]): string {
  const labels: Record<GovernanceCommand, string> = {
    pin: "keep this memory prominent",
    unpin: "remove its priority override",
    soften: "reduce its retrieval influence",
    unsoften: "restore its normal retrieval influence",
    hide: "exclude it from active retrieval while preserving reversibility",
    restore: "return it to the active memory field"
  };

  return `The user asked Pensieve to ${commands.map((command) => labels[command]).join(" and ")}.`;
}

export function getGovernancePendingChanges(
  currentMemories: readonly DashboardMemoryRecord[],
  baselineMemories: readonly DashboardMemoryRecord[],
  previousReport?: GovernanceReport | null
): GovernanceChange[] {
  const baseline = resolveBaselineState(baselineMemories, previousReport);

  return currentMemories.flatMap((memory) => {
    const after = toGovernanceState(memory);
    const before = baseline.get(memory.id) ?? after;

    if (statesMatch(before, after)) {
      return [];
    }

    const commands = deriveCommands(before, after);
    // Redact before truncation, so partial credentials cannot survive a soft mask.
    const governedDisplay = getGovernedMemoryDisplay({ ...memory, content: redactSensitiveText(memory.content) });
    return [{
      memory_id: memory.id,
      content: redactSensitiveText(governedDisplay.content),
      risk_level: memory.risk_level,
      commands,
      before,
      after,
      reason: buildReason(commands)
    }];
  });
}

export function createGovernanceReport({
  reportId,
  createdAt,
  provider,
  currentMemories,
  baselineMemories,
  previousReport
}: CreateGovernanceReportInput): GovernanceReport {
  return {
    schema_version: GOVERNANCE_REPORT_SCHEMA_VERSION,
    report_id: reportId,
    previous_report_id: previousReport?.report_id ?? null,
    created_at: createdAt,
    source: {
      product: "pensieve",
      provider,
      mode: "query-free"
    },
    status: "ready",
    changes: getGovernancePendingChanges(currentMemories, baselineMemories, previousReport),
    resulting_state: currentMemories.map(toGovernanceState)
  };
}

export function redactGovernanceReport(report: GovernanceReport, secrets: readonly string[] = []): GovernanceReport {
  return { ...report,
    source: { ...report.source, provider: redactSensitiveText(report.source.provider, secrets) },
    changes: report.changes.map(change => ({ ...change,
      content: redactSensitiveText(change.content, secrets),
      reason: redactSensitiveText(change.reason, secrets)
    }))
  };
}

export function renderGovernanceReportMarkdown(input: GovernanceReport): string {
  const report = redactGovernanceReport(input);
  const lines = [
    "---",
    `schema_version: \"${report.schema_version}\"`,
    `report_id: \"${report.report_id}\"`,
    `previous_report_id: ${report.previous_report_id ? `\"${report.previous_report_id}\"` : "null"}`,
    `created_at: \"${report.created_at}\"`,
    `provider: \"${report.source.provider}\"`,
    "status: \"ready\"",
    "---",
    "",
    "# Pensieve Memory Governance Report",
    "",
    "This report records user-approved memory governance state. A host adapter should apply the structured manifest, then return a receipt for verification.",
    "",
    "## Summary",
    "",
    `${report.changes.length} memory ${report.changes.length === 1 ? "change is" : "changes are"} ready for host synchronization.`,
    "",
    "## Governance Changes",
    ""
  ];

  if (report.changes.length === 0) {
    lines.push("No governance changes are pending.", "");
  } else {
    report.changes.forEach((change, index) => {
      lines.push(
        `### ${index + 1}. ${change.memory_id}`,
        "",
        `- Commands: ${change.commands.map((command) => `\`${command}\``).join(", ")}`,
        `- Risk: ${change.risk_level}`,
        `- Before: status=${change.before.status}, pinned=${change.before.pinned}`,
        `- After: status=${change.after.status}, pinned=${change.after.pinned}`,
        `- Reason: ${change.reason}`,
        "",
        `> ${change.content}`,
        ""
      );
    });
  }

  lines.push(
    "## Execution Contract",
    "",
    "- Apply changes by `memory_id`; do not infer additional personal information.",
    "- Treat `hide` as reversible suppression, not physical deletion.",
    "- Use the JSON manifest as the machine-readable source of truth.",
    "- Return an itemized receipt and verify the resulting memory state.",
    ""
  );

  return lines.join("\n");
}

export function createGovernanceReceipt(input: {
  receiptId: string;
  verifiedAt: string;
  report: GovernanceReport;
  memories: readonly DashboardMemoryRecord[];
}): GovernanceReceipt {
  const current = new Map(input.memories.map((memory) => [memory.id, toGovernanceState(memory)]));
  const changedIds = new Set(input.report.changes.map((change) => change.memory_id));
  const expectedStates = input.report.resulting_state.filter((state) => changedIds.has(state.memory_id));
  const items: GovernanceReceiptItem[] = expectedStates.map((expected) => {
    const actual = current.get(expected.memory_id);

    if (!actual) {
      return { memory_id: expected.memory_id, status: "missing", expected };
    }

    return {
      memory_id: expected.memory_id,
      status: statesMatch(expected, actual) ? "verified" : "drifted",
      expected,
      actual
    };
  });

  return {
    receipt_id: input.receiptId,
    report_id: input.report.report_id,
    verified_at: input.verifiedAt,
    status: items.every((item) => item.status === "verified") ? "verified" : "drifted",
    items
  };
}
