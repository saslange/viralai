"use client";

import { useEffect } from "react";
import type { PostWithAccount } from "@/lib/types";

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div>
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
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="relative w-full bg-black">
            {post.media_type === "video" && post.media_url ? (
              <video
                src={post.media_url}
                poster={post.thumbnail_url ?? undefined}
                controls
                autoPlay
                playsInline
                className="max-h-[60vh] w-full"
              />
            ) : post.media_url || post.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.media_url ?? post.thumbnail_url ?? ""}
                alt={post.hook ?? "Instagram post"}
                className="max-h-[60vh] w-full object-contain"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-neutral-500">
                Kein Medium verfügbar
              </div>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div className="flex gap-4 text-sm font-medium text-neutral-800">
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
            {post.why_it_works && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Warum es funktioniert
                </p>
                <p className="mt-1 text-sm text-neutral-700">{post.why_it_works}</p>
              </div>
            )}
            {post.caption && (
              <p className="whitespace-pre-line text-sm text-neutral-600">{post.caption}</p>
            )}
            {post.permalink && (
              <a
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                Auf Instagram ansehen ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
