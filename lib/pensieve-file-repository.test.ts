import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  applyPensieveRepositoryAction,
  readPensieveRepository
} from "./pensieve-file-repository.ts";

test("file repository seeds local records when the repository file does not exist", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pensieve-repository-"));
  const repositoryPath = path.join(directory, "memories.json");

  const records = await readPensieveRepository(repositoryPath);

  assert.equal(records.length, 5);
  assert.equal(records[0]?.pinned, false);

  const written = JSON.parse(await readFile(repositoryPath, "utf8")) as Array<{ id: string }>;
  assert.equal(written.length, 5);
});

test("file repository persists dashboard actions back to the local JSON store", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pensieve-repository-"));
  const repositoryPath = path.join(directory, "memories.json");

  const pinned = await applyPensieveRepositoryAction(
    {
      type: "pin",
      memory_id: "memory-2",
      value: true
    },
    repositoryPath
  );

  assert.equal(pinned.changedRecord.pinned, true);

  const hidden = await applyPensieveRepositoryAction(
    {
      type: "hide",
      memory_id: "memory-2"
    },
    repositoryPath
  );

  assert.equal(hidden.changedRecord.status, "forgotten");
  assert.equal(hidden.changedRecord.pinned, false);

  const restored = await readPensieveRepository(repositoryPath);
  const record = restored.find((item) => item.id === "memory-2");

  assert.equal(record?.status, "forgotten");
  assert.equal(record?.pinned, false);
});

