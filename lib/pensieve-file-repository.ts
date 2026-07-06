import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type DashboardAction } from "./pensieve-dashboard-core.ts";
import { loadBaseMemories, type PersistedMemoryRecord } from "./memory-store.ts";
import { applyDashboardActionToRecords } from "./pensieve-records.ts";

const defaultRepositoryPath = path.join(process.cwd(), "data", "pensieve-memory-records.json");

function cloneRecord(record: PersistedMemoryRecord): PersistedMemoryRecord {
  return {
    ...record,
    keywords: [...record.keywords]
  };
}

function seedRecords(): PersistedMemoryRecord[] {
  return loadBaseMemories().map(cloneRecord);
}

function isPersistedRecord(value: unknown): value is PersistedMemoryRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedMemoryRecord>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.content === "string" &&
    Array.isArray(candidate.keywords) &&
    candidate.keywords.every((keyword) => typeof keyword === "string") &&
    typeof candidate.created_at === "string" &&
    typeof candidate.last_activated === "string" &&
    typeof candidate.activation_count === "number" &&
    typeof candidate.base_importance === "number" &&
    typeof candidate.pinned === "boolean" &&
    typeof candidate.risk_level === "string" &&
    typeof candidate.status === "string"
  );
}

export async function ensurePensieveRepository(
  repositoryPath = defaultRepositoryPath
): Promise<PersistedMemoryRecord[]> {
  try {
    const content = await readFile(repositoryPath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed) || !parsed.every(isPersistedRecord)) {
      throw new Error("Invalid repository contents.");
    }

    return parsed.map(cloneRecord);
  } catch (error) {
    await mkdir(path.dirname(repositoryPath), { recursive: true });
    const seeded = seedRecords();
    await writeFile(repositoryPath, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
}

export async function writePensieveRepository(
  records: readonly PersistedMemoryRecord[],
  repositoryPath = defaultRepositoryPath
): Promise<void> {
  await mkdir(path.dirname(repositoryPath), { recursive: true });
  await writeFile(repositoryPath, JSON.stringify(records, null, 2), "utf8");
}

export async function readPensieveRepository(
  repositoryPath = defaultRepositoryPath
): Promise<PersistedMemoryRecord[]> {
  return ensurePensieveRepository(repositoryPath);
}

export async function applyPensieveRepositoryAction(
  action: DashboardAction,
  repositoryPath = defaultRepositoryPath
) {
  const records = await ensurePensieveRepository(repositoryPath);
  const next = applyDashboardActionToRecords(records, action);

  await writePensieveRepository(next.records, repositoryPath);

  return next;
}

export function getPensieveRepositoryPath(): string {
  return defaultRepositoryPath;
}
