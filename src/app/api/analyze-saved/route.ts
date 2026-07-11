import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzePosts, type PostAnalysisInput } from "@/lib/anthropic";

export const maxDuration = 60;

const BATCH_SIZE = 15;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function POST() {
  const supabase = await createClient();

  // Get all posts that have been saved but don't have labels yet
  const { data: savedSwipes } = await supabase
    .from("swipes")
    .select("post_id")
    .eq("decision", "save");

  if (!savedSwipes || savedSwipes.length === 0) {
    return NextResponse.json({ analyzed: 0, message: "No saved posts to analyze" });
  }

  const postIds = savedSwipes.map((s) => s.post_id);

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, hook, caption, media_type, like_count, comment_count, view_count")
    .in("id", postIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!posts || posts.length === 0) return NextResponse.json({ analyzed: 0 });

  const inputs: PostAnalysisInput[] = posts.map((p) => ({
    id: p.id,
    hook: p.hook,
    caption: p.caption,
    media_type: p.media_type,
    like_count: p.like_count,
    comment_count: p.comment_count,
    view_count: p.view_count,
  }));

  let analyzed = 0;
  for (const batch of chunk(inputs, BATCH_SIZE)) {
    let results: Awaited<ReturnType<typeof analyzePosts>>;
    try {
      results = await analyzePosts(batch);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Anthropic-API-Fehler";
      return NextResponse.json({ error: message, analyzed }, { status: 502 });
    }

    for (const [id, result] of Object.entries(results)) {
      const { error: updateError } = await supabase
        .from("posts")
        .update({ hook_category: result.category, why_it_works: result.why, label: result.label })
        .eq("id", id);
      if (!updateError) analyzed += 1;
    }
  }

  return NextResponse.json({ analyzed, message: "Saved posts labeled successfully" });
}
