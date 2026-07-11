import { createClient } from "@/lib/supabase/server";
import { SwipeDeck } from "@/components/swipe-deck";
import { AccountFilter } from "@/components/account-filter";
import type { PostWithAccount, TrackedAccount } from "@/lib/types";

export default async function SwipePage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: accountId } = await searchParams;
  const supabase = await createClient();

  const [{ data: swiped }, { data: accounts }] = await Promise.all([
    supabase.from("swipes").select("post_id"),
    supabase.from("tracked_accounts").select("*").order("username", { ascending: true }),
  ]);
  const swipedIds = (swiped ?? []).map((s) => s.post_id);

  let query = supabase
    .from("posts")
    .select("*, tracked_accounts(username, avatar_url)")
    .order("posted_at", { ascending: false })
    .limit(30);

  let remainingCountQuery = supabase.from("posts").select("id", { count: "exact", head: true });

  let scopedSwipesQuery = supabase.from("swipes").select("decision, posts!inner(account_id)");

  if (accountId) {
    query = query.eq("account_id", accountId);
    remainingCountQuery = remainingCountQuery.eq("account_id", accountId);
    scopedSwipesQuery = scopedSwipesQuery.eq("posts.account_id", accountId);
  }
  if (swipedIds.length > 0) {
    query = query.not("id", "in", `(${swipedIds.join(",")})`);
    remainingCountQuery = remainingCountQuery.not("id", "in", `(${swipedIds.join(",")})`);
  }

  const [{ data: posts }, { count: remainingCount }, { data: scopedSwipes }] = await Promise.all([
    query,
    remainingCountQuery,
    scopedSwipesQuery,
  ]);

  const keepCount = (scopedSwipes ?? []).filter((s) => s.decision === "keep").length;
  const saveCount = (scopedSwipes ?? []).filter((s) => s.decision === "save").length;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-neutral-900">Swipe</h1>
        <p className="text-sm text-neutral-500">
          Rechts = behalten, links = verwerfen, hoch = merken für später.
        </p>
      </div>

      <div className="mb-5 flex gap-4 text-sm">
        <span className="font-medium text-neutral-700">
          🔥 <span className="font-bold">{remainingCount ?? 0}</span> im Stapel
        </span>
        <span className="font-medium text-emerald-600">
          ✓ <span className="font-bold">{keepCount}</span> behalten
        </span>
        <span className="font-medium text-amber-600">
          ★ <span className="font-bold">{saveCount}</span> gemerkt
        </span>
      </div>

      <AccountFilter accounts={(accounts as TrackedAccount[] | null) ?? []} />
      <SwipeDeck
        key={accountId ?? "all"}
        initialPosts={(posts as PostWithAccount[] | null) ?? []}
      />
    </div>
  );
}
