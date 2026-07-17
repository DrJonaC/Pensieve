import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createGovernanceReceipt,
  createGovernanceReport,
  getGovernancePendingChanges,
  renderGovernanceReportMarkdown,
  type GovernanceBridgeStatus,
  type GovernanceReceipt,
  type GovernanceReport,
  type GovernanceReportArtifact
} from "./pensieve-governance-bridge.ts";
import { type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";

const defaultGovernanceRoot = path.join(process.cwd(), "data", "pensieve-governance");

type GovernanceRepositoryOptions = {
  rootPath?: string;
  now?: () => Date;
  idFactory?: () => string;
};

function buildArtifactId(prefix: string, now: Date, idFactory: () => string): string {
  const timestamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 17);
  return `${prefix}-${timestamp}-${idFactory().slice(0, 8)}`;
}

async function readLatestJson<T>(directory: string): Promise<T | null> {
  try {
    const files = (await readdir(directory))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .reverse();

    if (!files[0]) {
      return null;
    }

    return JSON.parse(await readFile(path.join(directory, files[0]), "utf8")) as T;
  } catch {
    return null;
  }
}

function resolveOptions(options: GovernanceRepositoryOptions = {}) {
  return {
    rootPath: options.rootPath ?? defaultGovernanceRoot,
    now: options.now ?? (() => new Date()),
    idFactory: options.idFactory ?? randomUUID
  };
}

export async function readLatestGovernanceReport(
  options: GovernanceRepositoryOptions = {}
): Promise<GovernanceReport | null> {
  const { rootPath } = resolveOptions(options);
  return readLatestJson<GovernanceReport>(path.join(rootPath, "reports"));
}

export async function readLatestGovernanceReceipt(
  options: GovernanceRepositoryOptions = {}
): Promise<GovernanceReceipt | null> {
  const { rootPath } = resolveOptions(options);
  return readLatestJson<GovernanceReceipt>(path.join(rootPath, "receipts"));
}

export async function readGovernanceReport(
  reportId: string,
  options: GovernanceRepositoryOptions = {}
): Promise<GovernanceReport> {
  if (!/^governance-[a-zA-Z0-9-]+$/.test(reportId)) {
    throw new Error("Invalid governance report id.");
  }

  const { rootPath } = resolveOptions(options);
  return JSON.parse(
    await readFile(path.join(rootPath, "reports", `${reportId}.json`), "utf8")
  ) as GovernanceReport;
}

export async function getGovernanceBridgeStatus(input: {
  currentMemories: readonly DashboardMemoryRecord[];
  baselineMemories: readonly DashboardMemoryRecord[];
  options?: GovernanceRepositoryOptions;
}): Promise<GovernanceBridgeStatus> {
  const latestReport = await readLatestGovernanceReport(input.options);
  const latestReceipt = await readLatestGovernanceReceipt(input.options);
  const pendingChanges = getGovernancePendingChanges(
    input.currentMemories,
    input.baselineMemories,
    latestReport
  );

  return {
    pending_change_count: pendingChanges.length,
    latest_report: latestReport,
    latest_receipt: latestReceipt
  };
}

export async function writeGovernanceReport(input: {
  currentMemories: readonly DashboardMemoryRecord[];
  baselineMemories: readonly DashboardMemoryRecord[];
  provider: string;
  options?: GovernanceRepositoryOptions;
}): Promise<GovernanceReportArtifact> {
  const { rootPath, now, idFactory } = resolveOptions(input.options);
  const createdAt = now();
  const previousReport = await readLatestGovernanceReport({ rootPath });
  const report = createGovernanceReport({
    reportId: buildArtifactId("governance", createdAt, idFactory),
    createdAt: createdAt.toISOString(),
    provider: input.provider,
    currentMemories: input.currentMemories,
    baselineMemories: input.baselineMemories,
    previousReport
  });

  if (report.changes.length === 0) {
    throw new Error("No governance changes are pending.");
  }

  const reportsDirectory = path.join(rootPath, "reports");
  const manifestPath = path.join(reportsDirectory, `${report.report_id}.json`);
  const markdownPath = path.join(reportsDirectory, `${report.report_id}.md`);
  const markdown = renderGovernanceReportMarkdown(report);

  await mkdir(reportsDirectory, { recursive: true });
  await writeFile(manifestPath, JSON.stringify(report, null, 2), "utf8");
  await writeFile(markdownPath, markdown, "utf8");

  return {
    report,
    markdown,
    manifest_path: path.relative(process.cwd(), manifestPath),
    markdown_path: path.relative(process.cwd(), markdownPath)
  };
}

export async function writeGovernanceReceipt(input: {
  report: GovernanceReport;
  memories: readonly DashboardMemoryRecord[];
  options?: GovernanceRepositoryOptions;
}): Promise<GovernanceReceipt> {
  const { rootPath, now, idFactory } = resolveOptions(input.options);
  const verifiedAt = now();
  const receipt = createGovernanceReceipt({
    receiptId: buildArtifactId("receipt", verifiedAt, idFactory),
    verifiedAt: verifiedAt.toISOString(),
    report: input.report,
    memories: input.memories
  });
  const receiptsDirectory = path.join(rootPath, "receipts");

  await mkdir(receiptsDirectory, { recursive: true });
  await writeFile(
    path.join(receiptsDirectory, `${receipt.receipt_id}.json`),
    JSON.stringify(receipt, null, 2),
    "utf8"
  );

  return receipt;
}

export function getGovernanceRepositoryPath(): string {
  return defaultGovernanceRoot;
}
