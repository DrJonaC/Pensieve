import { mkdir, readFile, writeFile, rename, unlink, open } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { validateRecords } from "./memory-transfer.ts";
import path from "node:path";
import { type DashboardAction } from "./pensieve-dashboard-core.ts";
import { loadBaseMemories, type PersistedMemoryRecord } from "./memory-store.ts";
import { applyDashboardActionToRecords } from "./pensieve-records.ts";

const defaultRepositoryPath = path.join(process.env.PENSIEVE_DATA_DIR ?? path.join(process.cwd(), "data"), "pensieve-memory-records.json");

function cloneRecord(record: PersistedMemoryRecord): PersistedMemoryRecord {
  return {
    ...record,
    keywords: [...record.keywords]
  };
}

function seedRecords(): PersistedMemoryRecord[] {
  return loadBaseMemories().map(cloneRecord);
}

export async function ensurePensieveRepository(
  repositoryPath = defaultRepositoryPath
): Promise<PersistedMemoryRecord[]> {
  try {
    const content = await readFile(repositoryPath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    return validateRecords(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(path.dirname(repositoryPath), { recursive: true });
    const seeded = seedRecords();
    try {
      await writeFile(repositoryPath, JSON.stringify(seeded), { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      return validateRecords(JSON.parse(await readFile(repositoryPath, "utf8")));
    }
    return seeded;
  }
}

export async function writePensieveRepository(
  records: readonly PersistedMemoryRecord[],
  repositoryPath = defaultRepositoryPath
): Promise<void> {
  await mkdir(path.dirname(repositoryPath), { recursive: true });
  validateRecords(records);
  const temporaryPath = `${repositoryPath}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporaryPath, "wx");
    try { await handle.writeFile(JSON.stringify(records), "utf8"); await handle.sync(); }
    finally { await handle.close(); }
    await rename(temporaryPath, repositoryPath);
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
  }
}

export async function readPensieveRepository(
  repositoryPath = defaultRepositoryPath
): Promise<PersistedMemoryRecord[]> {
  return ensurePensieveRepository(repositoryPath);
}

export async function applyPensieveRepositoryAction(
  action: DashboardAction,
  repositoryPath = defaultRepositoryPath,
  expectedRevision?: string
) {
  return withRepositoryLock(repositoryPath, async () => {
    const records = await ensurePensieveRepository(repositoryPath);
    if (expectedRevision !== undefined && repositoryRevision(records) !== expectedRevision) {
      throw new RepositoryConflictError("Memory changed. Refresh and retry / 记忆已变化，请刷新后重试");
    }
    const next = applyDashboardActionToRecords(records, action);
    await writeFile(`${repositoryPath}.${Date.now()}-${randomUUID()}.bak`, JSON.stringify(records), { encoding: "utf8", flag: "wx" });
    await writePensieveRepository(next.records, repositoryPath);
    return next;
  });
}

// An exclusive lock also protects writes from separate local server processes.
async function withRepositoryLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  await mkdir(path.dirname(key), { recursive: true });
  const deadline = Date.now() + 5000;
  let handle;
  while (!handle) {
    try { handle = await open(key + ".lock", "wx"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (Date.now() > deadline) throw new RepositoryConflictError("Store busy / 记忆库忙，请稍后重试");
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  }
  try { return await task(); }
  finally { await handle.close(); await unlink(key + ".lock"); }
}

export function repositoryRevision(records: readonly PersistedMemoryRecord[]): string {
  return createHash("sha256").update(JSON.stringify(records)).digest("hex");
}

export class RepositoryConflictError extends Error {}

export async function mutateMemoryRepository(
  revision: string,
  transform: (records: PersistedMemoryRecord[]) => PersistedMemoryRecord[],
  repositoryPath = defaultRepositoryPath
) {
  return withRepositoryLock(repositoryPath, async () => {
    const records = await readPensieveRepository(repositoryPath);
    if (repositoryRevision(records) !== revision) throw new RepositoryConflictError("Memory changed. Refresh and retry / 记忆已变化，请刷新后重试");
    const next = validateRecords(transform(records));
    const backup = `${repositoryPath}.${Date.now()}-${randomUUID()}.bak`;
    await writeFile(backup, JSON.stringify(records), { encoding: "utf8", flag: "wx" });
    await writePensieveRepository(next, repositoryPath);
    return { records: next, revision: repositoryRevision(next) };
  });
}

export function getPensieveRepositoryPath(): string {
  return defaultRepositoryPath;
}
