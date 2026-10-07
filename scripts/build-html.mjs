// Builds a copy of the site that opens straight from disk (double-click,
// file://) — no server, no text editing.
//
//   node scripts/build-html.mjs
//
// 1. `STATIC_HTML=1 next build` → static export (see next.config.ts), run in
//    a throwaway copy of the project (.html-build/, node_modules linked in).
//    Not in place: Next still wrote build files into `.next` despite a
//    separate distDir, replacing the build the running `next start` (3000)
//    serves mid-flight — its pages then asked for chunks that no longer
//    existed (500s, blank page). The copy has its own `.next`.
// 2. Copies the export to site-html/ and rewrites root-absolute URLs
//    ("/sites/…", "/_next/…") to relative ones, since from file:// "/" is
//    the drive root.
// 3. Writes open-site.html next to package.json, which opens
//    site-html/index.html.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, ".html-build");
const built = path.join(work, ".next-html");
const out = path.join(root, "site-html");

// Everything the build reads; never build output, git or the copies themselves.
const SKIP = new Set([".git", ".next", ".next-html", ".html-build", "node_modules", "site-html", "out", ".playwright-mcp", "open-site.html", "braindeck-site.zip", "tests", "docs"]);

// .html-build/node_modules is a junction to the real node_modules: remove the
// link itself first (never recursing into it), and refuse if it's ever a
// real folder, so cleaning up can't touch the project's dependencies.
function removeWork() {
  const link = path.join(work, "node_modules");
  let st = null;
  try {
    st = lstatSync(link);
  } catch {}
  if (st) {
    if (!st.isSymbolicLink()) {
      console.error(`✗ ${link} is not a link; not deleting .html-build`);
      process.exit(1);
    }
    try {
      unlinkSync(link);
    } catch {
      rmdirSync(link);
    }
  }
  rmSync(work, { recursive: true, force: true });
}
removeWork();
mkdirSync(work);
for (const name of readdirSync(root)) {
  if (SKIP.has(name)) continue;
  cpSync(path.join(root, name), path.join(work, name), { recursive: true });
}
symlinkSync(path.join(root, "node_modules"), path.join(work, "node_modules"), "junction");

console.log("› next build (static export, in .html-build/)…");
const res = spawnSync("npx next build", {
  cwd: work,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, STATIC_HTML: "1" },
});
if (res.status !== 0) process.exit(res.status ?? 1);
if (!existsSync(path.join(built, "index.html"))) {
  console.error("✗ .html-build/.next-html/index.html not found");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
cpSync(built, out, {
  recursive: true,
  // Build intermediates aren't part of the site.
  filter: (src) => !/[\\/](cache|types|server|diagnostics|trace)([\\/]|$)/.test(path.relative(built, src)),
});

// Public folders referenced as "/name/…" in the markup, styles and bundles.
const PUBLIC = readdirSync(path.join(root, "public")).filter((n) => statSync(path.join(root, "public", n)).isDirectory());
const publicRe = new RegExp(`(["'(\\s,=])/((?:${[...PUBLIC, "_next"].join("|")})/)`, "g");

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let files = 0;
let refs = 0;
for (const file of walk(out)) {
  const ext = path.extname(file);
  if (![".html", ".css", ".js", ".txt"].includes(ext)) continue;
  const src = readFileSync(file, "utf8");
  // HTML / RSC payload / JS resolve against the page; CSS against itself.
  const base = ext === ".css" ? path.dirname(file) : path.dirname(file) === out || ext === ".js" ? out : path.dirname(file);
  const up = path.relative(base, out).split(path.sep).join("/");
  const prefix = up ? `${up}/` : "./";
  let n = 0;
  let next = src.replace(publicRe, (_, lead, dir) => {
    n++;
    return `${lead}${prefix}${dir}`;
  });
  // Nested pages: assetPrefix "./" is relative to *their* folder.
  if (ext === ".html" && up) next = next.replace(/(["'(])\.\/_next\//g, `$1${prefix}_next/`);
  // From file:// every file is its own origin, so anything requested in CORS
  // mode is blocked: <script crossorigin> (→ the app never boots) and fonts.
  // Drop the attribute (also in the RSC payload, which React re-renders),
  // and the font preloads — the fonts are inlined into the CSS below.
  if (ext === ".html" || ext === ".txt") {
    next = next
      .replace(/<link rel="preload"[^>]*as="font"[^>]*\/?>/g, "")
      .replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>/])/gi, "")
      .replace(/\\"crossOrigin\\":\\"[^"\\]*\\"/g, '\\"data-co\\":\\"\\"')
      .replace(/"crossOrigin":"[^"]*"/g, '"data-co":""');
  }
  if (ext === ".html") {
    // The web-app manifest is fetched in CORS mode too; not needed offline.
    next = next.replace(/<link rel="manifest"[^>]*\/?>/g, "");
    // Internal links ("/", "/solutions/x") point at the drive root from
    // file://, and Next's router can't fetch pages there either. Catch the
    // click first (document, capture phase — before React) and open the
    // exported file instead: "/" → index.html, "/a/b" → a/b.html.
    const linkFix = `<script>(function(){var R=${JSON.stringify(prefix)};document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;var h=a.getAttribute("href");if(!h||h.charAt(0)!=="/"||h.charAt(1)==="/")return;var i=h.indexOf("#"),hash=i<0?"":h.slice(i),p=(i<0?h:h.slice(0,i)).split("?")[0];e.preventDefault();e.stopPropagation();if(p==="/"||p===""){if(hash&&/index\\.html$/.test(location.pathname)){location.hash=hash;return}location.href=R+"index.html"+hash;return}location.href=R+p.replace(/^\\/|\\/$/g,"")+".html"+hash},true)})();</script>`;
    next = next.replace("</body>", `${linkFix}</body>`);
  }
  // Next's getAssetPrefix() looks for the literal assetPrefix + "_next/"
  // ("./_next/") in the resolved script URL, which from file:// is an
  // absolute path — so it threw and the app never started. Look for
  // "/_next/" instead: the prefix is then the folder's own path.
  if (ext === ".js") next = next.replaceAll('.indexOf("./_next/")', '.indexOf("/_next/")');
  // Fonts: always fetched in CORS mode, so embed them as data: URIs.
  if (ext === ".css") {
    next = next.replace(/url\((["']?)([^)"']+\.(woff2?|ttf|otf))\1\)/g, (m, _q, ref, kind) => {
      const fontFile = path.resolve(path.dirname(file), ref);
      if (!existsSync(fontFile)) return m;
      n++;
      const mime = kind === "woff2" ? "font/woff2" : kind === "woff" ? "font/woff" : kind === "otf" ? "font/otf" : "font/ttf";
      return `url(data:${mime};base64,${readFileSync(fontFile).toString("base64")})`;
    });
  }
  if (next !== src) {
    writeFileSync(file, next);
    files++;
    refs += n;
  }
}

writeFileSync(
  path.join(root, "open-site.html"),
  // Opened straight from inside a zip, Windows extracts only this one file
  // to a temp folder, so site-html/ isn't next to it: the redirect then shows
  // a bare ERR_FILE_NOT_FOUND. Probe for site-html/ first (a script tag's
  // onerror fires for a missing file:// script) and explain instead.
  `<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Braindeck</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #05070a; color: #e8ecef; font: 16px/1.6 system-ui, "Malgun Gothic", sans-serif; }
  main { max-width: 34rem; padding: 2rem 1.5rem; }
  h1 { margin: 0 0 1rem; font-size: 1.35rem; color: #7dff6a; }
  ol { padding-left: 1.25rem; }
  .en { margin-top: 1.5rem; color: #9aa4ad; font-size: 0.9rem; }
  #missing { display: none; }
</style>
<main>
  <p id="opening">Opening… <a href="site-html/index.html">site-html/index.html</a></p>
  <div id="missing">
    <h1>압축을 먼저 풀어 주세요</h1>
    <p>zip 파일 안에서 바로 열면 사이트 파일(site-html 폴더)을 찾을 수 없습니다.</p>
    <ol>
      <li>zip 파일을 오른쪽 클릭 → <b>모두 압축 풀기</b></li>
      <li>압축이 풀린 폴더에서 <b>open-site.html</b>을 더블클릭</li>
    </ol>
    <p class="en">Please unzip first: right-click the zip → Extract All, then open <b>open-site.html</b> in the extracted folder.</p>
  </div>
</main>
<script>
  function siteMissing() {
    document.getElementById("opening").style.display = "none";
    document.getElementById("missing").style.display = "block";
  }
</script>
<script src="site-html/open-check.js" onload="location.replace('site-html/index.html')" onerror="siteMissing()"></script>
</html>
`,
);
// The file open-site.html probes for (see above).
writeFileSync(path.join(out, "open-check.js"), "// open-site.html checks that this folder is here.\n");

removeWork();
console.log(`✓ site-html/ ready (${refs} URLs made relative in ${files} files)`);
console.log("  Open: open-site.html (or site-html/index.html)");
