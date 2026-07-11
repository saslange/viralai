"use client";

import { useEffect } from "react";
import type { PostWithAccount } from "@/lib/types";

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function extractHashtags(text: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/#\w+/g) || [];
  return matches.slice(0, 3);
}

export function PostLightbox({ post, onClose }: { post: PostWithAccount; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const hashtags = extractHashtags(post.caption || post.hook);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl gap-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Media */}
        <div className="relative w-1/2 min-w-0 bg-black">
          {post.media_type === "video" && post.media_url ? (
            <video
              src={post.media_url}
              poster={post.thumbnail_url ?? undefined}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : post.media_url || post.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url ?? post.thumbnail_url ?? ""}
              alt={post.hook ?? "Instagram post"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-500">
              Kein Medium verfügbar
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex w-1/2 min-w-0 flex-col overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">
                @{post.tracked_accounts.username}
              </p>
              {post.posted_at && (
                <p className="text-xs text-neutral-400">
                  {new Date(post.posted_at).toLocaleDateString("de-DE")}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-5 py-4">
            {/* Tags */}
            {hashtags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement Stats */}
            <div className="mb-4 flex gap-4 text-sm font-medium text-neutral-700">
              <span className="flex items-center gap-1">
                ❤️ {formatCount(post.like_count)}
              </span>
              <span className="flex items-center gap-1">
                💬 {formatCount(post.comment_count)}
              </span>
              <span className="flex items-center gap-1">
                👁 {formatCount(post.view_count)}
              </span>
            </div>

            {/* Why it works */}
            {post.why_it_works && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Warum es funktioniert
                </p>
                <p className="mt-2 text-sm text-neutral-700">{post.why_it_works}</p>
              </div>
            )}

            {/* Caption */}
            {post.caption && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Caption
                </p>
                <p className="whitespace-pre-line text-sm text-neutral-600">{post.caption}</p>
              </div>
            )}

            {/* Link to Instagram */}
            {post.permalink && (
              <div>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
                >
                  Auf Instagram ansehen ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
