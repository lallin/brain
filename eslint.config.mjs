import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // scripts/build-html.mjs output (static export + its work copy).
    "site-html/**",
    ".html-build/**",
    ".next-html/**",
    // Downloaded copy of the live site's bundle (research input, not our code).
    "docs/research/braindeck-live/bundle.js",
  ]),
]);

export default eslintConfig;
