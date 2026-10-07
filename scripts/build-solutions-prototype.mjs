// Builds a shareable copy of solutions-4step.html: one self-contained
// index.html with three.js, the marble's textures, the fonts and every image
// inlined, so it opens on any computer — sent on its own, offline, or from
// a zip — with no server and no CDN.
//
//   node scripts/build-solutions-prototype.mjs
//
// Writes braindeck-solutions-prototype/ (index.html + README.txt) and
// braindeck-solutions-prototype.zip next to package.json. Downloads (Google
// Fonts, the marble textures) are cached in node_modules/.cache/; esbuild
// runs through npx.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "solutions-4step.html");
const NAME = "braindeck-solutions-prototype";
const OUT = path.join(root, NAME);
const ZIP = path.join(root, `${NAME}.zip`);
const CACHE = path.join(root, "node_modules", ".cache", "solutions-prototype");
const ESBUILD = "esbuild@0.28.2";
// Google Fonts only serves woff2 to a modern browser user agent.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
// Cards are shown at most 540px wide; 2× that keeps them sharp on retina.
const IMAGE_WIDTH = 1100;

mkdirSync(CACHE, { recursive: true });

async function cached(url) {
  const file = path.join(CACHE, createHash("sha1").update(url).digest("hex").slice(0, 16));
  if (!existsSync(file)) {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return readFileSync(file);
}

const dataUri = (mime, buf) => `data:${mime};base64,${buf.toString("base64")}`;

async function image(rel) {
  const file = path.join(root, rel);
  if (rel.endsWith(".png") && rel.includes("logo")) return dataUri("image/png", readFileSync(file));
  const buf = await sharp(file).resize({ width: IMAGE_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  return dataUri("image/webp", buf);
}

async function replaceAsync(str, re, fn) {
  const jobs = [];
  str.replace(re, (...m) => {
    jobs.push(fn(...m));
    return "";
  });
  const done = await Promise.all(jobs);
  let i = 0;
  return str.replace(re, () => done[i++]);
}

let html = readFileSync(SRC, "utf8");

// Fonts: the latin subsets of the Google Fonts stylesheet, as data URIs (the
// page's copy is English; the Korean notes fall back to the system font).
const fontHref = html.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)" rel="stylesheet">/)?.[1];
if (!fontHref) throw new Error("Google Fonts <link> not found in solutions-4step.html");
const fontCss = await replaceAsync(
  (await cached(fontHref.replace(/&amp;/g, "&")))
    .toString()
    .split(/(?=\/\* )/)
    .filter((block) => block.startsWith("/* latin */"))
    .join(""),
  /url\((https:[^)]+)\)/g,
  async (_, url) => `url(${dataUri("font/woff2", await cached(url))})`,
);

// Script: images and textures inlined, then three.js bundled in with esbuild.
let js = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
if (!js) throw new Error('<script type="module"> not found in solutions-4step.html');
const IMG = js.match(/const IMG = "([^"]+)"/)?.[1];
if (!IMG) throw new Error("const IMG not found");
js = await replaceAsync(js, /`\$\{IMG\}\/([^`]+)`/g, async (_, rel) => JSON.stringify(await image(`${IMG}/${rel}`)));
js = await replaceAsync(js, /"(https:\/\/cdn\.jsdelivr\.net\/gh\/[^"]+)"/g, async (_, url) =>
  JSON.stringify(dataUri(url.endsWith(".jpg") ? "image/jpeg" : "application/octet-stream", await cached(url))),
);
// One command string (shell: npx is npx.cmd on Windows); the arguments are fixed.
const bundled = spawnSync(
  `npx --yes ${ESBUILD} --bundle --format=iife --minify --target=es2020 --log-level=warning --loader=js --sourcefile=solutions-4step.js`,
  { cwd: root, input: js, encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 },
);
if (bundled.status !== 0) throw new Error(`esbuild failed:\n${bundled.stderr}`);
if (bundled.stderr.trim()) console.warn(bundled.stderr.trim());

html = html
  .replace(/<!--[\s\S]*?-->/, "<!--\n  Shareable build of solutions-4step.html (scripts/build-solutions-prototype.mjs).\n  Everything is inlined: open this file in Chrome or Edge, no internet needed.\n-->")
  .replace(/\s*<link rel="preconnect"[^>]*>/g, "")
  .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, "")
  .replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, "")
  .replace("<style>", () => `<style>\n${fontCss}`);
html = await replaceAsync(html, /src="(public\/[^"]+)"/g, async (_, rel) => `src="${await image(rel)}"`);
html = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => `<script>\n${bundled.stdout.replace(/<\/script/gi, "<\\/script")}</script>`);
if (/public\/sites\/|cdn\.jsdelivr|fonts\.googleapis/.test(html)) throw new Error("an external reference is left in the build");

const README = [
  "Braindeck - Solutions 4단계 프로토타입",
  "",
  "[여는 방법]",
  "index.html을 Chrome 또는 Edge 브라우저로 여세요. (더블클릭)",
  "- 메신저나 메일의 '미리보기' 창에서는 실행되지 않습니다. 파일을 저장한 뒤 브라우저로 여세요.",
  "- zip으로 받았다면 먼저 압축을 풀어 주세요.",
  "- 이미지, 3D 구, 글꼴이 모두 index.html 한 파일에 들어 있어서 인터넷 없이도 열립니다.",
  "  index.html 파일 하나만 보내도 됩니다.",
  "",
  "[조작]",
  "- 마우스 휠 / 위아래 방향키 / PageUp, PageDown / 터치 스와이프: 한 번에 한 파트씩 이동",
  "- 순서: COMPANY -> 01 Voucher -> 02 Media & Content -> 03 Health Care -> 04 Enterprise -> EXCELLENCE",
  "- 아래쪽 점, 화살표, 하단 메뉴를 눌러도 이동합니다.",
  "",
  "[참고]",
  "- COMPANY, EXCELLENCE 화면은 위치만 보여주는 자리표시입니다.",
  "- 목록, 카드, Learn More 버튼은 상세 페이지로 연결되지 않습니다.",
  "- PC 화면 기준으로 만들었습니다.",
].join("\r\n");

rmSync(OUT, { recursive: true, force: true });
rmSync(ZIP, { force: true });
mkdirSync(OUT);
writeFileSync(path.join(OUT, "index.html"), html);
writeFileSync(path.join(OUT, "README.txt"), "\uFEFF" + README + "\r\n");

// Forward-slash entry names (Windows tar), so the folder unpacks on macOS too.
const zipped =
  process.platform === "win32"
    ? spawnSync(path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"), ["-a", "-c", "-f", ZIP, "-C", root, NAME])
    : spawnSync("zip", ["-qr", ZIP, NAME], { cwd: root });
if (zipped.status !== 0) throw new Error(`zip failed: ${zipped.stderr}`);

const mb = (f) => (statSync(f).size / 1024 / 1024).toFixed(2);
console.log(`${NAME}/index.html  ${mb(path.join(OUT, "index.html"))} MB`);
console.log(`${NAME}.zip        ${mb(ZIP)} MB`);
