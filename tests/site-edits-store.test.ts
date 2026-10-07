// Regression test for the 2026-09-28 data/site-edits.json wipe (≈150 keys → 1).
// Runs the real store (src/lib/site-edits-store.ts) against throwaway files in
// the OS temp dir — never the real data file. Run: `npm test`.
//
// It also runs the same stress harness against the OLD save logic and requires
// that to lose data: proof the harness can actually catch this bug, so a green
// run means "fixed", not "the test never races".
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSiteEditsStore, ShrinkBlockedError } from "../src/lib/site-edits-store.ts";

const SEED_KEYS = 150;
const TRIALS = 300;

let dir = "";
let fileSeq = 0;
before(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "site-edits-test-"));
});
after(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function seed(n = SEED_KEYS): Record<string, string> {
  const edits: Record<string, string> = {};
  for (let i = 0; i < n; i++) edits[`k${i}`] = "x".repeat(80);
  return edits;
}

async function freshFile(contents: Record<string, string> = seed()): Promise<string> {
  const file = path.join(dir, `edits-${fileSeq++}.json`);
  await fs.writeFile(file, JSON.stringify(contents, null, 2));
  return file;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The reproduction from the incident: 3 saves, 2 of them a few ms late — like
 * drag-end + drag-end + double-click reset landing almost together. */
async function staggeredTriple(save: (key: string) => Promise<void>): Promise<void> {
  await Promise.all([
    save("a"),
    sleep(Math.random() * 3).then(() => save("b")),
    sleep(Math.random() * 3).then(() => save("c")),
  ]);
}

interface StressResult {
  wiped: number;
  corrupt: number;
  lostNewKeys: number;
}

/** Runs TRIALS rounds; after each, checks all seed keys + all 3 new keys survive. */
async function stress(makeSave: (file: string) => (key: string) => Promise<void>): Promise<StressResult> {
  const result: StressResult = { wiped: 0, corrupt: 0, lostNewKeys: 0 };
  for (let t = 0; t < TRIALS; t++) {
    const file = await freshFile();
    await staggeredTriple(makeSave(file)).catch(() => {});
    let keys: string[];
    try {
      keys = Object.keys(JSON.parse(await fs.readFile(file, "utf-8")));
    } catch {
      result.corrupt++;
      continue;
    }
    const have = new Set(keys);
    if (Object.keys(seed()).some((k) => !have.has(k))) result.wiped++;
    result.lostNewKeys += ["a", "b", "c"].filter((k) => !have.has(k)).length;
  }
  return result;
}

describe("site-edits store — 2026-09-28 wipe regression", () => {
  test("canary: the harness catches the OLD save logic losing data", async () => {
    // Verbatim shape of the pre-fix route: swallow read errors as {}, and
    // writeFile (truncate-then-write) with no serialization.
    const oldSave = (file: string) => async (key: string) => {
      let edits: Record<string, string> = {};
      try {
        edits = JSON.parse(await fs.readFile(file, "utf-8"));
      } catch {
        edits = {};
      }
      edits[key] = "v";
      await fs.writeFile(file, JSON.stringify(edits, null, 2), "utf-8");
    };
    const r = await stress(oldSave);
    assert.ok(
      r.wiped + r.corrupt + r.lostNewKeys > 0,
      `old logic survived ${TRIALS} staggered triples untouched — the harness no longer races, so the real test below proves nothing`,
    );
  });

  test(`${TRIALS} staggered concurrent triples: no wipe, no corruption, no lost save`, async () => {
    const r = await stress((file) => {
      const store = createSiteEditsStore(file);
      return (key) => store.setKey(key, "v");
    });
    assert.deepEqual(r, { wiped: 0, corrupt: 0, lostNewKeys: 0 });
  });

  test("burst of 100 simultaneous saves: every key lands", async () => {
    const file = await freshFile();
    const store = createSiteEditsStore(file);
    const keys = Array.from({ length: 100 }, (_, i) => `burst${i}`);
    await Promise.all(keys.map((k) => store.setKey(k, "v")));
    const saved = JSON.parse(await fs.readFile(file, "utf-8"));
    assert.equal(Object.keys(saved).length, SEED_KEYS + keys.length);
  });

  test("readers outside the save queue never see a half-written file", async () => {
    // GET and the page's SiteEditsHydrator read the file directly while saves
    // are in flight — only the atomic temp+rename write keeps that safe.
    const file = await freshFile(seed(2000)); // big enough that a write takes real time
    const store = createSiteEditsStore(file);
    let done = false;
    let partialReads = 0;
    const reader = (async () => {
      while (!done) {
        const raw = await fs.readFile(file, "utf-8").catch(() => "");
        try {
          JSON.parse(raw);
        } catch {
          partialReads++;
        }
        await sleep(0);
      }
    })();
    try {
      // Also proves saves still succeed while the file is being read (on
      // Windows the rename would otherwise fail with EPERM — see
      // renameWithRetry in the store).
      await Promise.all(Array.from({ length: 40 }, (_, i) => store.setKey(`r${i}`, "v")));
    } finally {
      done = true;
      await reader;
    }
    assert.equal(partialReads, 0);
    assert.equal(Object.keys(JSON.parse(await fs.readFile(file, "utf-8"))).length, 2040);
  });

  test("corrupt file on disk: save is refused and the file is not overwritten", async () => {
    const file = await freshFile();
    const full = await fs.readFile(file, "utf-8");
    const half = full.slice(0, Math.floor(full.length / 2)); // what a mid-write read used to see
    await fs.writeFile(file, half);
    const store = createSiteEditsStore(file);
    await assert.rejects(store.setKey("new", "v"));
    assert.equal(await fs.readFile(file, "utf-8"), half);
  });

  test("file clobbered to a tiny valid object: shrink guard blocks the save", async () => {
    const file = await freshFile();
    const store = createSiteEditsStore(file);
    await store.getAll(); // store now knows the file held 150 keys
    const tiny = JSON.stringify({ a: "1", b: "2" });
    await fs.writeFile(file, tiny);
    await assert.rejects(store.setKey("new", "v"), (err: unknown) => {
      assert.ok(err instanceof ShrinkBlockedError);
      assert.equal(err.current, SEED_KEYS);
      assert.equal(err.next, 3);
      return true;
    });
    assert.equal(await fs.readFile(file, "utf-8"), tiny);
  });

  test("normal edits still work, including on a small or missing store", async () => {
    const missing = path.join(dir, "does-not-exist.json");
    const store = createSiteEditsStore(missing);
    await store.setKey("first", "1");
    assert.deepEqual(JSON.parse(await fs.readFile(missing, "utf-8")), { first: "1" });

    const file = await freshFile();
    const big = createSiteEditsStore(file);
    await big.setKey("k0", "changed");
    const saved = JSON.parse(await fs.readFile(file, "utf-8"));
    assert.equal(saved.k0, "changed");
    assert.equal(Object.keys(saved).length, SEED_KEYS);
  });

  test("no temp files are left behind", async () => {
    const leftovers = (await fs.readdir(dir)).filter((f) => f.endsWith(".tmp"));
    assert.deepEqual(leftovers, []);
  });
});
