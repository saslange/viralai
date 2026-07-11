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
  if (decision === "keep") return { text: "KEEP", color: "text-emerald-400 border-emerald-400" };
  if (decision === "leave") return { text: "LEAVE", color: "text-red-400 border-red-400" };
  return { text: "SAVE", color: "text-amber-400 border-amber-400" };
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
      className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-xl"
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
          className={`pointer-events-none absolute right-6 top-6 z-10 rounded-lg border-2 px-3 py-1 text-lg font-bold ${decisionLabel(dragDecision).color}`}
        >
          {decisionLabel(dragDecision).text}
        </div>
      )}

      <div
        className="relative w-full shrink-0 bg-neutral-800"
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
          <div className="flex h-full items-center justify-center text-neutral-600">
            Kein Bild
          </div>
        )}

        {post.media_type === "video" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur">
              <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          @{post.tracked_accounts.username}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="flex gap-5 text-sm text-neutral-100">
          <span>❤️ {formatCount(post.like_count)}</span>
          <span>💬 {formatCount(post.comment_count)}</span>
          <span>👁 {formatCount(post.view_count)}</span>
        </div>
        <p className="line-clamp-[9] whitespace-pre-line text-sm text-neutral-300">
          {post.caption ?? post.hook ?? "Keine Caption erkannt"}
        </p>
        <p className="mt-auto text-[11px] text-neutral-500">Antippen für Video/Vollbild</p>
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
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 text-center"
        style={{ height: CARD_HEIGHT }}
      >
        <p className="text-neutral-300">Alle Postings durchgesehen 🎉</p>
        <p className="mt-1 text-sm text-neutral-500">
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
          className="rounded-full border border-red-400/40 px-5 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10"
        >
          ✕ Leave
        </button>
        <button
          onClick={() => handleButton("save")}
          className="rounded-full border border-amber-400/40 px-5 py-2 text-sm font-medium text-amber-400 hover:bg-amber-400/10"
        >
          ↑ Save
        </button>
        <button
          onClick={() => handleButton("keep")}
          className="rounded-full border border-emerald-400/40 px-5 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-400/10"
        >
          ✓ Keep
        </button>
      </div>
      <p className="text-xs text-neutral-600">
        Ziehen oder Pfeiltasten: ← Leave · → Keep · ↑ Save · Bild antippen für Details
      </p>

      {expandedPost && (
        <PostLightbox post={expandedPost} onClose={() => setExpandedPost(null)} />
      )}
    </div>
  );
}
