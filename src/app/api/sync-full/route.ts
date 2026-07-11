import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchUserPosts, extractHook } from "@/lib/scrapecreators";

export const maxDuration = 300; // 5 minutes for full scrape

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: accounts, error } = await supabase
    .from("tracked_accounts")
    .select("id, username")
    .eq("is_active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { username: string; synced: number; error?: string }[] = [];

  for (const account of accounts ?? []) {
    try {
      // Full scrape without date filter - fetch ALL posts
      const posts = await fetchUserPosts(account.username);

      if (posts.length > 0) {
        const rows = posts.map((post) => ({
          account_id: account.id,
          ig_post_id: post.ig_post_id,
          permalink: post.permalink,
          media_type: post.media_type,
          media_url: post.media_url,
          thumbnail_url: post.thumbnail_url,
          caption: post.caption,
          hook: extractHook(post.caption),
          like_count: post.like_count,
          comment_count: post.comment_count,
          view_count: post.view_count,
          posted_at: post.posted_at,
        }));

        const { error: upsertError } = await supabase
          .from("posts")
          .upsert(rows, { onConflict: "account_id,ig_post_id", ignoreDuplicates: false });

        if (upsertError) throw upsertError;
      }

      await supabase
        .from("tracked_accounts")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", account.id);

      results.push({ username: account.username, synced: posts.length });
    } catch (err) {
      results.push({
        username: account.username,
        synced: 0,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  return NextResponse.json({ results, mode: "full_sync" });
}
