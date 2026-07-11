import { createClient } from "@/lib/supabase/server";
import type { PostWithAccount } from "@/lib/types";

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

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
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">Gemerkt</h1>
        <p className="text-sm text-neutral-500">
          Postings, die du für später als Inspiration gespeichert hast.
        </p>
      </div>

      {orderedPosts.length === 0 ? (
        <p className="text-sm text-neutral-500">Noch nichts gemerkt.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {orderedPosts.map((post) => (
            <a
              key={post.id}
              href={post.permalink ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-square w-full bg-neutral-100">
                {post.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.thumbnail_url}
                    alt={post.hook ?? ""}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-fuchsia-600">
                  @{post.tracked_accounts.username}
                </p>
                <p className="line-clamp-2 text-xs text-neutral-600">{post.hook}</p>
                <p className="mt-1 text-[10px] text-neutral-400">
                  ❤️ {formatCount(post.like_count)} · 💬 {formatCount(post.comment_count)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
