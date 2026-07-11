"use client";

import { useState, useMemo } from "react";
import type { PostWithAccount } from "@/lib/types";

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function SavedGrid({ posts }: { posts: PostWithAccount[] }) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const labels = useMemo(() => {
    const unique = new Set(posts.map((p) => p.label).filter(Boolean));
    return Array.from(unique).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!selectedLabel) return posts;
    return posts.filter((p) => p.label === selectedLabel);
  }, [posts, selectedLabel]);

  return (
    <div className="space-y-6">
      {/* Label Filter */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLabel(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedLabel === null
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Alle ({posts.length})
          </button>
          {labels.map((label) => (
            <button
              key={label}
              onClick={() => setSelectedLabel(label)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selectedLabel === label
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 text-neutral-700 hover:border-neutral-300"
              }`}
            >
              {label} ({posts.filter((p) => p.label === label).length})
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filteredPosts.length === 0 ? (
        <p className="text-sm text-neutral-500">Keine Posts mit diesem Label.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filteredPosts.map((post) => (
            <a
              key={post.id}
              href={post.permalink ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
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
              <div className="flex flex-1 flex-col p-2">
                <p className="text-xs font-semibold text-neutral-900">
                  @{post.tracked_accounts.username}
                </p>
                <p className="line-clamp-2 text-xs text-neutral-600">{post.hook}</p>
                {post.label && (
                  <p className="mt-1 inline-block rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                    {post.label}
                  </p>
                )}
                <p className="mt-auto pt-1 text-[10px] text-neutral-400">
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
