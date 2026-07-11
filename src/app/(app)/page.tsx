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

  if (accountId) {
    query = query.eq("account_id", accountId);
  }
  if (swipedIds.length > 0) {
    query = query.not("id", "in", `(${swipedIds.join(",")})`);
  }

  const { data: posts } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">Swipe</h1>
        <p className="text-sm text-neutral-500">
          Rechts = behalten, links = verwerfen, hoch = merken für später.
        </p>
      </div>
      <AccountFilter accounts={(accounts as TrackedAccount[] | null) ?? []} />
      <SwipeDeck
        key={accountId ?? "all"}
        initialPosts={(posts as PostWithAccount[] | null) ?? []}
      />
    </div>
  );
}
