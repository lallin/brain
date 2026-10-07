import { promises as fs } from "fs";
import path from "path";

// The durable store behind the inline "click to edit" feature: one flat
// JSON object on disk (data/site-edits.json), mutated one key at a time by
// POST /api/site-edits. Kept free of Next.js imports (and of TS syntax that
// Node's type stripping can't erase) so tests/site-edits-store.test.ts can
// run this exact code with plain `node --test`.
//
// History: on 2026-09-28 the whole store was wiped (≈150 keys → 1). The old
// POST did `readFile → JSON.parse → writeFile` with no serialization, and
// `writeFile` truncates the file before writing it. A second POST arriving
// inside that window read an empty/partial file, JSON.parse threw, the catch
// returned `{}`, and it wrote `{ itsOneKey }` over everything. Four layers
// stop that now — each one covered by the regression test:
//   1. writes are serialized (one read-modify-write at a time),
//   2. writes are atomic (temp file + rename, never a truncated file),
//   3. a corrupt/unreadable file throws instead of reading as `{}`,
//   4. a save that would drop ≥ 50% of the keys is refused.

/** A save that would leave fewer than this share of the current keys is refused. */
export const SHRINK_LIMIT = 0.5;
/** Below this many keys the guard stays out of the way (tiny stores shrink legitimately). */
export const SHRINK_MIN_KEYS = 10;

export type Edits = Record<string, string>;

export class ShrinkBlockedError extends Error {
  readonly current: number;
  readonly next: number;
  constructor(current: number, next: number) {
    super(`Refusing to save: key count would drop from ${current} to ${next}`);
    this.name = "ShrinkBlockedError";
    this.current = current;
    this.next = next;
  }
}

// On Windows, renaming over a file fails with EPERM/EBUSY/EACCES while any
// other handle has it open — e.g. the page's SiteEditsHydrator or a GET
// reading it at that moment (measured: 177 of 200 renames failed under a
// concurrent read loop). The lock is momentary, so retry with a short
// backoff (~2.5s total) instead of failing the save.
const RETRYABLE_RENAME = new Set(["EPERM", "EBUSY", "EACCES"]);

async function renameWithRetry(from: string, to: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code ?? "";
      if (!RETRYABLE_RENAME.has(code) || attempt >= 30) throw err;
      await new Promise((r) => setTimeout(r, Math.min(5 + attempt * 5, 150)));
    }
  }
}

export function createSiteEditsStore(file: string) {
  // Largest key count this store has seen written/read successfully — the
  // guard's memory, so a file clobbered to a tiny *valid* object is still
  // caught even though the file itself no longer "remembers" what it held.
  let lastKnownCount = 0;
  let queue: Promise<unknown> = Promise.resolve();

  // Only a *missing* file means "no edits yet"; anything else unreadable throws.
  async function read(): Promise<Edits> {
    let raw: string;
    try {
      raw = await fs.readFile(file, "utf-8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw err;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Edits;
    throw new Error(`${path.basename(file)} is not a JSON object`);
  }

  async function countOnDisk(): Promise<number | null> {
    try {
      return Object.keys(await read()).length;
    } catch {
      return null;
    }
  }

  async function currentCount(): Promise<number> {
    return Math.max(lastKnownCount, (await countOnDisk()) ?? 0);
  }

  async function assertNoLargeShrink(next: Edits): Promise<void> {
    const current = await currentCount();
    const nextCount = Object.keys(next).length;
    if (current >= SHRINK_MIN_KEYS && nextCount < current * SHRINK_LIMIT) {
      throw new ShrinkBlockedError(current, nextCount);
    }
  }

  // Temp file + rename: a concurrent reader only ever sees a complete file.
  async function write(edits: Edits): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(edits, null, 2), "utf-8");
    try {
      await renameWithRetry(tmp, file);
    } catch (err) {
      await fs.rm(tmp, { force: true });
      throw err;
    }
    lastKnownCount = Object.keys(edits).length;
  }

  function serialized<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  }

  return {
    /** Read the whole store (throws if the file exists but is unreadable). */
    async getAll(): Promise<Edits> {
      const edits = await read();
      lastKnownCount = Math.max(lastKnownCount, Object.keys(edits).length);
      return edits;
    },
    /** Set one key. Throws ShrinkBlockedError, or the read error, without writing. */
    setKey(key: string, value: string): Promise<void> {
      return serialized(async () => {
        const edits = await read();
        edits[key] = value;
        await assertNoLargeShrink(edits);
        await write(edits);
      });
    },
    /** Wipe everything — only for an explicit, confirmed "clear all". */
    clearAll(): Promise<void> {
      return serialized(() => write({}));
    },
    currentCount,
  };
}
