import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseMemoryImport, exportMemoryJson, mergeMemoryImport, validateRecords } from "./memory-transfer.ts";
import { readPensieveRepository, writePensieveRepository, mutateMemoryRepository, repositoryRevision, RepositoryConflictError } from "./pensieve-file-repository.ts";

test("JSON round trip preserves governance and provenance; text stays literal", () => {
  const records = parseMemoryImport("- 喜欢简洁回答\n- 使用 TypeScript\n- 使用 TypeScript", "text");
  records[0].status = "forgotten";
  assert.equal(records.length, 3);
  assert.equal(mergeMemoryImport([], records).skipped, 1);
  assert.deepEqual(parseMemoryImport(exportMemoryJson(records), "json"), records);
  assert.equal(records[0].content, "喜欢简洁回答");
  assert.equal(records[0].origin_tp, "consent-required");
});

test("imports reject unsupported formats, invalid metadata, oversized content and duplicate IDs", () => {
  const records = parseMemoryImport("Hello", "text");
  for (const value of [null, {}, { format: "pensieve-memory", version: 2, memories: records },
    [{ ...records[0], base_importance: 2 }], [{ ...records[0], status: "bogus" }],
    [{ ...records[0], created_at: "yesterday" }], [records[0], records[0]]]) {
    assert.throws(() => parseMemoryImport(JSON.stringify(value), "json"));
  }
  assert.throws(() => parseMemoryImport("x".repeat(1_000_001), "text"));
  assert.throws(() => validateRecords([{ ...records[0], base_importance: NaN }]));
});

test("merge never overwrites an existing memory with a colliding ID or text", () => {
  const existing = parseMemoryImport("Original", "text");
  const incoming = [{ ...existing[0], content: "Changed" }, ...parseMemoryImport("original\nNew", "text")];
  const result = mergeMemoryImport(existing, incoming);
  assert.equal(result.skipped, 2);
  assert.equal(result.added, 1);
  assert.equal(result.records[0].content, "Original");
});

test("corrupt repository is preserved instead of reseeded", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pensieve-corrupt-"));
  const file = path.join(directory, "memory.json");
  try {
    await writeFile(file, "broken-json");
    await assert.rejects(readPensieveRepository(file));
    assert.equal(await readFile(file, "utf8"), "broken-json");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("edits/deletes survive reload, create backups, and reject stale concurrent writers", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pensieve-mutation-"));
  const file = path.join(directory, "memory.json");
  try {
    const records = parseMemoryImport("Original", "text");
    await writePensieveRepository(records, file);
    const revision = repositoryRevision(records);
    const results = await Promise.allSettled([
      mutateMemoryRepository(revision, current => current.map(m => ({ ...m, content: "Edited A" })), file),
      mutateMemoryRepository(revision, current => current.map(m => ({ ...m, content: "Edited B" })), file)
    ]);
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    const rejected = results.find(result => result.status === "rejected");
    assert.ok(rejected?.reason instanceof RepositoryConflictError);
    const edited = await readPensieveRepository(file);
    assert.ok(["Edited A", "Edited B"].includes(edited[0].content));
    const backup = (await readdir(directory)).find(name => name.endsWith(".bak"))!;
    assert.deepEqual(JSON.parse(await readFile(path.join(directory, backup), "utf8")), records);
    await mutateMemoryRepository(repositoryRevision(edited), () => [], file);
    assert.deepEqual(await readPensieveRepository(file), []);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
