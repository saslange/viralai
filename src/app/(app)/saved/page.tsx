import { createClient } from "@/lib/supabase/server";
import { SavedGrid } from "@/components/saved-grid";
import { LabelButton } from "@/components/label-button";
import type { PostWithAccount } from "@/lib/types";

export default async function SavedPage() {
  const supabase = await createClient();

  const { data: swipes } = await supabase
    .from("swipes")
    .select("post_id, swiped_at")
    .eq("decision", "save")
    .order("swiped_at", { ascending: false });

  const postIds = (swipes ?? []).map((s) => s.post_id);

  const { data: posts } =
    postIds.length > 0
      ? await supabase
          .from("posts")
          .select("*, tracked_accounts(username, avatar_url)")
          .in("id", postIds)
      : { data: [] as PostWithAccount[] };

  const orderedPosts = postIds
    .map((id) => (posts as PostWithAccount[] | null)?.find((p) => p.id === id))
    .filter((p): p is PostWithAccount => Boolean(p));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Gemerkt</h1>
          <p className="text-sm text-neutral-500">
            Postings, die du für später als Inspiration gespeichert hast.
          </p>
        </div>
        {orderedPosts.length > 0 && (
          <LabelButton count={orderedPosts.length} />
        )}
      </div>

      {orderedPosts.length === 0 ? (
        <p className="text-sm text-neutral-500">Noch nichts gemerkt.</p>
      ) : (
        <SavedGrid posts={orderedPosts} />
      )}
    </div>
  );
}
