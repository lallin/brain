// Asset downloader for boilerlab.ai clone — site-key boilerlab-ai-93c3cf36, page-key root-8a5edab2
// Downloads real assets from the live site into public/sites/boilerlab-ai-93c3cf36/root-8a5edab2/
import fs from "node:fs";
import path from "node:path";

const BASE = "https://boilerlab.ai";
const OUT = "public/sites/boilerlab-ai-93c3cf36/root-8a5edab2";

const assets = [
  // Global / SEO
  ["boiler-lab-logo.svg", "images/boiler-lab-logo.svg"],
  ["favicon-black.png", "seo/favicon-black.png"],
  ["site.webmanifest", "seo/site.webmanifest"],
  // Partners logos
  ["partners/zapier-logo.svg", "images/partners/zapier-logo.svg"],
  ["partners/hugging-face-logo.svg", "images/partners/hugging-face-logo.svg"],
  ["partners/wsu-logo.svg", "images/partners/wsu-logo.svg"],
  ["partners/adobe-logo.svg", "images/partners/adobe-logo.svg"],
  ["partners/teknik-force-logo.svg", "images/partners/teknik-force-logo.svg"],
  ["partners/data-stax-logo.svg", "images/partners/data-stax-logo.svg"],
  ["partners/global-gpt-logo.svg", "images/partners/global-gpt-logo.svg"],
  ["partners/fujifilm-logo.svg", "images/partners/fujifilm-logo.svg"],
  ["partners/trend-micro-logo.svg", "images/partners/trend-micro-logo.svg"],
  // Product logos
  ["products/sigma-logo.png", "images/products/sigma-logo.png"],
  ["products/atomic-mail-logo.svg", "images/products/atomic-mail-logo.svg"],
  ["products/aimlapi-logo.svg", "images/products/aimlapi-logo.svg"],
  ["products/atomicbot-logo.svg", "images/products/atomicbot-logo.svg"],
  ["products/overchat-logo.svg", "images/products/overchat-logo.svg"],
  ["products/vixio-logo.svg", "images/products/vixio-logo.svg"],
  ["products/docuchain-logo.svg", "images/products/docuchain-logo.svg"],
  ["products/atomic-agent-logo.svg", "images/products/atomic-agent-logo.svg"],
  ["products/atomic-chat-logo.svg", "images/products/atomic-chat-logo.svg"],
  // Product visual mockups (largest srcset variant)
  ["_astro/sigma.DknsM7o3_22MgQI.webp", "images/products/sigma-visual.webp"],
  ["_astro/atomic-mail.BGaEg6r9_Z1trsKO.webp", "images/products/atomic-mail-visual.webp"],
  ["_astro/ai-ml.CUUHfSXc_Z28bWVw.webp", "images/products/aimlapi-visual.webp"],
  ["_astro/atomic-bot.Cmc4mfUC_9drf4.webp", "images/products/atomicbot-visual.webp"],
  ["_astro/overchat.C0DAE7ne_ZrIBbP.webp", "images/products/overchat-visual.webp"],
  ["_astro/vixio.Yf1hMZ1C_2eMs0l.webp", "images/products/vixio-visual.webp"],
  ["_astro/docuchain.DFpmpAo5_ZQswoV.webp", "images/products/docuchain-visual.webp"],
  ["_astro/atomic-agent.9Fr1lz-E_ZL7E5J.webp", "images/products/atomic-agent-visual.webp"],
  ["_astro/atomic-chat.CrAN92l1_Z1XyiFm.webp", "images/products/atomic-chat-visual.webp"],
  // Moon (largest srcset variant)
  ["_astro/full-moon.DpHqaEQa_ZH08hB.webp", "images/full-moon.webp"],
  // Fonts
  ["_astro/OverusedGrotesk-Roman.CjlVX8Oq.woff2", "fonts/OverusedGrotesk-Roman.woff2"],
  ["_astro/OverusedGrotesk-Medium.Dd_veWuy.woff2", "fonts/OverusedGrotesk-Medium.woff2"],
  ["_astro/OverusedGrotesk-SemiBold.4t51KWdX.woff2", "fonts/OverusedGrotesk-SemiBold.woff2"],
  ["_astro/jetbrains-mono-latin-400-normal.V6pRDFza.woff2", "fonts/JetBrainsMono-400.woff2"],
  ["_astro/jetbrains-mono-latin-700-normal.BYuf6tUa.woff2", "fonts/JetBrainsMono-700.woff2"],
];

async function downloadOne(src, dest) {
  const url = `${BASE}/${src}`;
  const destPath = path.join(OUT, dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAILED ${res.status} ${url}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  console.log(`OK ${dest} (${buf.length} bytes)`);
  return true;
}

async function run() {
  const BATCH = 4;
  let ok = 0, fail = 0;
  for (let i = 0; i < assets.length; i += BATCH) {
    const chunk = assets.slice(i, i + BATCH);
    const results = await Promise.all(chunk.map(([src, dest]) => downloadOne(src, dest)));
    results.forEach((r) => (r ? ok++ : fail++));
  }
  console.log(`Done. ${ok} succeeded, ${fail} failed.`);
}

run();
