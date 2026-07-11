import { createClient } from "@/lib/supabase/server";
import { SwipeDeck } from "@/components/swipe-deck";
import type { PostWithAccount } from "@/lib/types";

export default async function SwipePage() {
  const supabase = await createClient();

  const { data: swiped } = await supabase.from("swipes").select("post_id");
  const swipedIds = (swiped ?? []).map((s) => s.post_id);

  let query = supabase
    .from("posts")
    .select("*, tracked_accounts(username, avatar_url)")
    .order("posted_at", { ascending: false })
    .limit(30);

  if (swipedIds.length > 0) {
    query = query.not("id", "in", `(${swipedIds.join(",")})`);
  }

  const { data: posts } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Swipe</h1>
        <p className="text-sm text-neutral-400">
          Rechts = behalten, links = verwerfen, hoch = merken für später.
        </p>
      </div>
      <SwipeDeck initialPosts={(posts as PostWithAccount[] | null) ?? []} />
    </div>
  );
}
