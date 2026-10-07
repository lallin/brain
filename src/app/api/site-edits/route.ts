import path from "path";
import { NextResponse } from "next/server";
import { SITE_EDITING_ENABLED } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/config";
import { createSiteEditsStore, ShrinkBlockedError } from "@/lib/site-edits-store";

// Durable, server-side store for the inline "click to edit" text feature
// (see src/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/).
// Backed by a plain JSON file on disk rather than the browser's localStorage,
// so an edit survives a reload, a different port, a cleared cache, or a
// different browser entirely — anything hitting this same dev server sees
// the same content. All the data-safety logic (serialized + atomic writes,
// corrupt-read refusal, shrink guard) lives in src/lib/site-edits-store.ts,
// which tests/site-edits-store.test.ts exercises directly.
const store = createSiteEditsStore(path.join(process.cwd(), "data", "site-edits.json"));

function shrinkResponse(err: ShrinkBlockedError) {
  return NextResponse.json(
    {
      error: `저장이 차단되었습니다: 저장된 항목이 ${err.current}개에서 ${err.next}개로 줄어듭니다. 데이터 손실을 막기 위해 아무것도 저장하지 않았습니다.`,
      code: "shrink-blocked",
      current: err.current,
      next: err.next,
    },
    { status: 409 },
  );
}

// Editing switched off (editable/config.ts): refuse every write, so a
// shared link can't change the copy even by calling the API directly.
function editingDisabled() {
  return NextResponse.json({ error: "Editing is disabled.", code: "editing-disabled" }, { status: 403 });
}

export async function GET() {
  return NextResponse.json(await store.getAll());
}

export async function POST(request: Request) {
  if (!SITE_EDITING_ENABLED) return editingDisabled();
  const body = (await request.json().catch(() => null)) as { key?: unknown; value?: unknown } | null;
  if (!body || typeof body.key !== "string" || typeof body.value !== "string") {
    return NextResponse.json({ error: "Expected JSON body { key: string, value: string }" }, { status: 400 });
  }
  try {
    await store.setKey(body.key, body.value);
  } catch (err) {
    if (err instanceof ShrinkBlockedError) return shrinkResponse(err);
    return NextResponse.json(
      { error: "site-edits.json을 읽을 수 없어 저장하지 않았습니다.", code: "read-failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

// Clearing everything is the ultimate shrink, so it must be asked for
// explicitly (`?confirm=clear-all`, sent only by clearAllEditedValues()).
export async function DELETE(request: Request) {
  if (!SITE_EDITING_ENABLED) return editingDisabled();
  if (new URL(request.url).searchParams.get("confirm") !== "clear-all") {
    return shrinkResponse(new ShrinkBlockedError(await store.currentCount(), 0));
  }
  await store.clearAll();
  return NextResponse.json({ ok: true });
}
