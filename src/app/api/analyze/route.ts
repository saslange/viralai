import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { categorizeHooks } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, hook")
    .is("hook_category", null)
    .not("hook", "is", null)
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!posts || posts.length === 0) return NextResponse.json({ categorized: 0 });

  let categories: Awaited<ReturnType<typeof categorizeHooks>>;
  try {
    categories = await categorizeHooks(
      posts.filter((p) => p.hook).map((p) => ({ id: p.id, hook: p.hook! }))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Anthropic-API-Fehler";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let categorized = 0;
  for (const [id, category] of Object.entries(categories)) {
    const { error: updateError } = await supabase
      .from("posts")
      .update({ hook_category: category })
      .eq("id", id);
    if (!updateError) categorized += 1;
  }

  return NextResponse.json({ categorized });
}
