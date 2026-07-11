import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SwipeDecision } from "@/lib/types";

const VALID_DECISIONS: SwipeDecision[] = ["keep", "leave", "save"];

export async function POST(request: Request) {
  const body = await request.json();
  const postId = String(body.post_id ?? "");
  const decision = body.decision as SwipeDecision;

  if (!postId || !VALID_DECISIONS.includes(decision)) {
    return NextResponse.json({ error: "post_id/decision ungültig" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("swipes")
    .upsert({ post_id: postId, decision, swiped_at: new Date().toISOString() }, { onConflict: "post_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("post_id");
  if (!postId) return NextResponse.json({ error: "post_id fehlt" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("swipes").delete().eq("post_id", postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
