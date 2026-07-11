import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContentIdeas, type PostAnalysisInput } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();

  const { data: swipes, error: swipesError } = await supabase
    .from("swipes")
    .select("post_id")
    .in("decision", ["keep", "save"]);

  if (swipesError) return NextResponse.json({ error: swipesError.message }, { status: 500 });

  const postIds = (swipes ?? []).map((s) => s.post_id);
  if (postIds.length === 0) {
    return NextResponse.json({ error: "Noch keine behaltenen/gemerkten Postings vorhanden." }, { status: 400 });
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, hook, caption, media_type, like_count, comment_count, view_count")
    .in("id", postIds)
    .order("like_count", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const inputs: PostAnalysisInput[] = (posts ?? []).map((p) => ({
    id: p.id,
    hook: p.hook,
    caption: p.caption,
    media_type: p.media_type,
    like_count: p.like_count,
    comment_count: p.comment_count,
    view_count: p.view_count,
  }));

  try {
    const ideas = await generateContentIdeas(inputs);
    return NextResponse.json({ ideas });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Anthropic-API-Fehler";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
