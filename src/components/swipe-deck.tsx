"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import type { PostWithAccount, SwipeDecision } from "@/lib/types";
import { PostLightbox } from "@/components/post-lightbox";

const SWIPE_THRESHOLD = 120;
const CARD_HEIGHT = 640;
const IMAGE_HEIGHT = 320;

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function decisionLabel(decision: SwipeDecision) {
  if (decision === "keep") return { text: "KEEP", color: "text-emerald-500 border-emerald-500" };
  if (decision === "leave") return { text: "LEAVE", color: "text-rose-500 border-rose-500" };
  return { text: "SAVE", color: "text-amber-500 border-amber-500" };
}

function Card({
  post,
  onSwiped,
  onExpand,
  isTop,
}: {
  post: PostWithAccount;
  onSwiped: (decision: SwipeDecision) => void;
  onExpand: () => void;
  isTop: boolean;
}) {
  const controls = useAnimation();
  const [dragDecision, setDragDecision] = useState<SwipeDecision | null>(null);

  function handleDrag(_: unknown, info: PanInfo) {
    if (!isTop) return;
    const { x, y } = info.offset;
    if (y < -SWIPE_THRESHOLD / 2 && Math.abs(y) > Math.abs(x)) {
      setDragDecision("save");
    } else if (x > SWIPE_THRESHOLD / 2) {
      setDragDecision("keep");
    } else if (x < -SWIPE_THRESHOLD / 2) {
      setDragDecision("leave");
    } else {
      setDragDecision(null);
    }
  }

  async function handleDragEnd(_: unknown, info: PanInfo) {
    if (!isTop) return;
    const { x, y } = info.offset;

    let decision: SwipeDecision | null = null;
    if (y < -SWIPE_THRESHOLD && Math.abs(y) > Math.abs(x)) decision = "save";
    else if (x > SWIPE_THRESHOLD) decision = "keep";
    else if (x < -SWIPE_THRESHOLD) decision = "leave";

    if (decision) {
      const target =
        decision === "save"
          ? { y: -900, opacity: 0 }
          : decision === "keep"
            ? { x: 900, opacity: 0 }
            : { x: -900, opacity: 0 };
      await controls.start({ ...target, transition: { duration: 0.3 } });
      onSwiped(decision);
    } else {
      controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
      setDragDecision(null);
    }
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/70"
      style={{ touchAction: "none" }}
      drag={isTop}
      dragElastic={0.9}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTap={() => isTop && onExpand()}
      animate={controls}
      initial={{ scale: 1 }}
    >
      {dragDecision && (
        <div
          className={`pointer-events-none absolute right-6 top-6 z-10 rounded-lg border-2 bg-white/90 px-3 py-1 text-lg font-bold ${decisionLabel(dragDecision).color}`}
        >
          {decisionLabel(dragDecision).text}
        </div>
      )}

      <div
        className="relative w-full shrink-0 bg-neutral-100"
        style={{ height: IMAGE_HEIGHT }}
      >
        {post.thumbnail_url || post.media_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url ?? post.media_url ?? ""}
            alt={post.hook ?? "Instagram post"}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            Kein Bild
          </div>
        )}

        {post.media_type === "video" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 backdrop-blur">
              <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          @{post.tracked_accounts.username}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="flex gap-4 text-sm font-medium">
          <span className="flex items-center gap-1 text-rose-500">
            ❤️ <span className="text-neutral-800">{formatCount(post.like_count)}</span>
          </span>
          <span className="flex items-center gap-1 text-sky-500">
            💬 <span className="text-neutral-800">{formatCount(post.comment_count)}</span>
          </span>
          <span className="flex items-center gap-1 text-violet-500">
            👁 <span className="text-neutral-800">{formatCount(post.view_count)}</span>
          </span>
        </div>
        <p className="line-clamp-[9] whitespace-pre-line text-sm text-neutral-600">
          {post.caption ?? post.hook ?? "Keine Caption erkannt"}
        </p>
        <p className="mt-auto text-[11px] text-neutral-400">Antippen für Video/Vollbild</p>
      </div>
    </motion.div>
  );
}

export function SwipeDeck({ initialPosts }: { initialPosts: PostWithAccount[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [expandedPost, setExpandedPost] = useState<PostWithAccount | null>(null);

  const recordSwipe = useCallback(async (postId: string, decision: SwipeDecision) => {
    await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, decision }),
    });
  }, []);

  const handleSwiped = useCallback(
    (postId: string, decision: SwipeDecision) => {
      recordSwipe(postId, decision);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    },
    [recordSwipe]
  );

  const topPost = posts[0];

  const handleButton = useCallback(
    (decision: SwipeDecision) => {
      if (topPost) handleSwiped(topPost.id, decision);
    },
    [topPost, handleSwiped]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (expandedPost) return;
      if (!topPost) return;
      if (e.key === "ArrowRight") handleButton("keep");
      if (e.key === "ArrowLeft") handleButton("leave");
      if (e.key === "ArrowUp") handleButton("save");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [topPost, handleButton, expandedPost]);

  const visiblePosts = useMemo(() => posts.slice(0, 3), [posts]);

  if (!topPost) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-center"
        style={{ height: CARD_HEIGHT }}
      >
        <p className="text-neutral-700">Alle Postings durchgesehen 🎉</p>
        <p className="mt-1 text-sm text-neutral-400">
          Neue Postings kommen mit dem nächsten Sync rein.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-sm" style={{ height: CARD_HEIGHT }}>
        {visiblePosts
          .map((post, i) => (
            <div
              key={post.id}
              className="absolute inset-0"
              style={{
                zIndex: visiblePosts.length - i,
                transform: `scale(${1 - i * 0.04}) translateY(${i * 10}px)`,
              }}
            >
              <Card
                post={post}
                isTop={i === 0}
                onSwiped={(decision) => handleSwiped(post.id, decision)}
                onExpand={() => setExpandedPost(post)}
              />
            </div>
          ))
          .reverse()}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleButton("leave")}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-rose-500 shadow-md shadow-rose-200/60 ring-1 ring-rose-200 transition hover:scale-105 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-200/70 active:scale-95"
        >
          ✕ Leave
        </button>
        <button
          onClick={() => handleButton("save")}
          className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-300/50 transition hover:scale-105 hover:shadow-lg hover:shadow-amber-300/60 active:scale-95"
        >
          ↑ Save
        </button>
        <button
          onClick={() => handleButton("keep")}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-300/50 transition hover:scale-105 hover:shadow-lg hover:shadow-emerald-300/60 active:scale-95"
        >
          ✓ Keep
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        Ziehen oder Pfeiltasten: ← Leave · → Keep · ↑ Save · Bild antippen für Details
      </p>

      {expandedPost && (
        <PostLightbox post={expandedPost} onClose={() => setExpandedPost(null)} />
      )}
    </div>
  );
}
