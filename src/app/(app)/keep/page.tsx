import { createClient } from "@/lib/supabase/server";
import { SavedGrid } from "@/components/saved-grid";
import type { PostWithAccount } from "@/lib/types";

export default async function KeepPage() {
  const supabase = await createClient();

  const { data: swipes } = await supabase
    .from("swipes")
    .select("post_id, swiped_at, decision");

  const postIds = (swipes ?? []).filter((s) => s.decision === "keep").map((s) => s.post_id);

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

  // Get counts for all tabs
  const allSwipes = swipes ?? [];
  const remainingCountQuery = await supabase.from("posts").select("id", { count: "exact", head: true }).not("id", "in", `(${(allSwipes.map((s) => s.post_id).join(",") || "0")})`);
  const remainingCount = remainingCountQuery.count || 0;

  const keepCount = orderedPosts.length;
  const saveCount = allSwipes.filter((s) => s.decision === "save").length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-8">
          <a href="/" className="pb-3 transition hover:text-neutral-700">
            <p className="text-sm font-medium text-neutral-400">
              Swipe <span className="text-neutral-400">{remainingCount}</span>
            </p>
          </a>
          <a href="/keep" className="border-b-2 border-neutral-900 pb-3 transition hover:text-neutral-700">
            <p className="text-sm font-semibold text-neutral-900">
              Behalten <span className="text-neutral-500">{keepCount}</span>
            </p>
          </a>
          <a href="/saved" className="pb-3 transition hover:text-neutral-700">
            <p className="text-sm font-medium text-neutral-400">
              Gemerkt <span className="text-neutral-400">{saveCount}</span>
            </p>
          </a>
        </div>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Behalten</h1>
        <p className="text-sm text-neutral-500">
          Postings, die du behalten möchtest.
        </p>
      </div>

      {orderedPosts.length === 0 ? (
        <p className="text-sm text-neutral-500">Noch nichts behalten.</p>
      ) : (
        <SavedGrid posts={orderedPosts} />
      )}
    </div>
  );
}
