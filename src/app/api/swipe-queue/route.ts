import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);

  const supabase = await createClient();

  // Posts without a swipe decision yet, newest first.
  const { data: swiped } = await supabase.from("swipes").select("post_id");
  const swipedIds = (swiped ?? []).map((s) => s.post_id);

  let query = supabase
    .from("posts")
    .select("*, tracked_accounts(username, avatar_url)")
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (swipedIds.length > 0) {
    query = query.not("id", "in", `(${swipedIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: data });
}
