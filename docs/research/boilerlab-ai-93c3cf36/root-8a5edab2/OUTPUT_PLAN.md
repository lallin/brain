# Output Plan — boilerlab.ai clone

## Target
- URL: https://boilerlab.ai
- Page title: "Boiler Lab | AI startups at rocket speed"
- Single URL, single page (`/`).

## App Root
- `<app-root>` = repository root (`.`) — single application, untouched Next.js + shadcn/ui + Tailwind v4 template.

## Keys
- `<site-key>` = `boilerlab-ai-93c3cf36` (origin `https://boilerlab.ai`, sha256 first 8 hex = `93c3cf36`)
- `<page-key>` = `root-8a5edab2` (pathname `/`, sha256 first 8 hex = `8a5edab2`)

## Destination Route
- `src/app/page.tsx` — this is the first single-URL clone in an untouched template, so the existing scaffold page is replaced. `/` remains the clone's route.

## Artifact Roots
- Research: `docs/research/boilerlab-ai-93c3cf36/root-8a5edab2/`
- Screenshots: `docs/design-references/boilerlab-ai-93c3cf36/root-8a5edab2/`
- Components: `src/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/` (page-specific), `src/components/sites/boilerlab-ai-93c3cf36/shared/` (shared icons/utilities, same-site only — moot for single page but kept for future pages on this origin)
- Assets: `public/sites/boilerlab-ai-93c3cf36/root-8a5edab2/`
- Asset download script: `scripts/download-assets-boilerlab-ai-93c3cf36-root-8a5edab2.mjs`

## Pre-existing State
- Template is untouched: only `src/app/page.tsx` (default scaffold) and `src/components/ui/*` (shadcn primitives) exist.
- No prior research, screenshots, or public assets for any site.
- No collisions to resolve.

## Shared Foundation Changes
- `src/app/layout.tsx` — fonts via `next/font/google` (or local), root metadata.
- `src/app/globals.css` — merge boilerlab.ai's color tokens/design tokens (single-site app, safe to set directly).

## Build Verification
- Base scaffold `npm run build` verified clean before any edits.
