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
      {/* Tabs */}
      <div className="mb-6 border-b border-neutral-200">
        <div className="flex gap-8">
          <div className="border-b-2 border-neutral-900 pb-3">
            <p className="text-sm font-semibold text-neutral-900">
              Swipe <span className="text-neutral-500">{remainingCount ?? 0}</span>
            </p>
          </div>
          <div className="pb-3">
            <p className="text-sm font-medium text-neutral-400">
              Behalten <span className="text-neutral-400">{keepCount}</span>
            </p>
          </div>
          <div className="pb-3">
            <p className="text-sm font-medium text-neutral-400">
              Gemerkt <span className="text-neutral-400">{saveCount}</span>
            </p>
          </div>
        </div>
      </div>

      <p className="mb-5 text-xs text-neutral-500">
        Rechts = behalten, links = verwerfen, hoch = merken für später.
      </p>

      <AccountFilter accounts={(accounts as TrackedAccount[] | null) ?? []} />
      <SwipeDeck
        key={accountId ?? "all"}
        initialPosts={(posts as PostWithAccount[] | null) ?? []}
      />
    </div>
  );
}
