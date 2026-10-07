import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "site-edits.json");

async function readEdits(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Server Component: reads data/site-edits.json (the durable store behind the
 * inline "click to edit" feature, see editable/storage.ts) and inlines it as
 * `window.__EDITABLE_OVERRIDES__` before the client bundle hydrates. Mount
 * once, high in the tree (root layout), so every route sees the same saved
 * edits with no flash of placeholder text and no client-side fetch race.
 */
export async function SiteEditsHydrator() {
  const edits = await readEdits();
  // Escape "<" so a saved edit containing the literal text "</script>" can't
  // break out of this inline script tag.
  const json = JSON.stringify(edits).replace(/</g, "\\u003c");
  return (
    <script
      id="site-edits-hydration"
      // Plain, non-module, non-async/defer script: the browser runs it
      // synchronously while parsing the HTML, so window.__EDITABLE_OVERRIDES__
      // is already set by the time any client component mounts.
      dangerouslySetInnerHTML={{ __html: `window.__EDITABLE_OVERRIDES__=${json};` }}
    />
  );
}
