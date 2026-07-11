import { createClient } from "@/lib/supabase/server";
import { AnalyzeButton } from "@/components/analyze-button";
import type { PostWithAccount, SwipeDecision } from "@/lib/types";

function engagementScore(post: PostWithAccount) {
  return (post.like_count ?? 0) + (post.comment_count ?? 0);
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ data: swipes }, { data: posts }] = await Promise.all([
    supabase.from("swipes").select("post_id, decision"),
    supabase.from("posts").select("*, tracked_accounts(username, avatar_url)"),
  ]);

  const allPosts = (posts as PostWithAccount[] | null) ?? [];
  const decisionByPostId = new Map<string, SwipeDecision>(
    (swipes ?? []).map((s) => [s.post_id, s.decision as SwipeDecision])
  );

  const counts = { keep: 0, leave: 0, save: 0, unswiped: 0 };
  for (const post of allPosts) {
    const decision = decisionByPostId.get(post.id);
    if (decision) counts[decision] += 1;
    else counts.unswiped += 1;
  }

  // Top accounts by average engagement among kept/saved posts.
  const accountStats = new Map<string, { count: number; totalEngagement: number }>();
  for (const post of allPosts) {
    const decision = decisionByPostId.get(post.id);
    if (decision !== "keep" && decision !== "save") continue;
    const key = post.tracked_accounts.username;
    const stat = accountStats.get(key) ?? { count: 0, totalEngagement: 0 };
    stat.count += 1;
    stat.totalEngagement += engagementScore(post);
    accountStats.set(key, stat);
  }
  const topAccounts = [...accountStats.entries()]
    .map(([username, stat]) => ({
      username,
      count: stat.count,
      avgEngagement: Math.round(stat.totalEngagement / stat.count),
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 8);

  // Hook category performance: share of kept/saved vs. left per category.
  const categoryStats = new Map<string, { keep: number; leave: number; save: number }>();
  for (const post of allPosts) {
    if (!post.hook_category) continue;
    const decision = decisionByPostId.get(post.id);
    if (!decision) continue;
    const stat = categoryStats.get(post.hook_category) ?? { keep: 0, leave: 0, save: 0 };
    stat[decision] += 1;
    categoryStats.set(post.hook_category, stat);
  }
  const categoryRows = [...categoryStats.entries()]
    .map(([category, stat]) => {
      const total = stat.keep + stat.leave + stat.save;
      return {
        category,
        total,
        resonanceRate: total > 0 ? Math.round(((stat.keep + stat.save) / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.resonanceRate - a.resonanceRate);

  const uncategorizedCount = allPosts.filter(
    (p) => p.hook && !p.hook_category && decisionByPostId.get(p.id)
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Trends</h1>
        <p className="text-sm text-neutral-500">
          Was bei dir und deinem Publikum funktioniert, basierend auf deinen Swipes.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Behalten", value: counts.keep, color: "text-emerald-500" },
          { label: "Gemerkt", value: counts.save, color: "text-amber-500" },
          { label: "Verworfen", value: counts.leave, color: "text-rose-500" },
          { label: "Offen", value: counts.unswiped, color: "text-neutral-500" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-neutral-500">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Hook-Muster, die ankommen</h2>
          <AnalyzeButton />
        </div>
        {categoryRows.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Noch keine kategorisierten Hooks. Swipe ein paar Postings und klick auf &quot;Neue
            Hooks analysieren&quot;{uncategorizedCount > 0 ? ` (${uncategorizedCount} bereit)` : ""}.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white shadow-sm">
            {categoryRows.map((row) => (
              <li key={row.category} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm capitalize text-neutral-800">
                  {row.category.replace("-", " ")}
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${row.resonanceRate}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-neutral-500">
                    {row.resonanceRate}% · n={row.total}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Stärkste Accounts</h2>
        {topAccounts.length === 0 ? (
          <p className="text-sm text-neutral-500">Noch keine behaltenen/gemerkten Postings.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white shadow-sm">
            {topAccounts.map((account) => (
              <li key={account.username} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-fuchsia-600">@{account.username}</span>
                <span className="text-xs text-neutral-500">
                  Ø {account.avgEngagement} Interaktionen · {account.count} Postings
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
