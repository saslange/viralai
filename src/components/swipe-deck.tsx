"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import type { MediaType, PostWithAccount, SwipeDecision } from "@/lib/types";
import { PostLightbox } from "@/components/post-lightbox";

const SWIPE_THRESHOLD = 120;
const CARD_HEIGHT = 640;
const IMAGE_HEIGHT = 260;

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatMediaType(type: MediaType) {
  if (type === "video") return "Video";
  if (type === "carousel") return "Album";
  return "Foto";
}

function formatAge(posted_at: string | null) {
  if (!posted_at) return "–";
  const diffMs = Date.now() - new Date(posted_at).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "heute";
  if (days === 1) return "vor 1 Tag";
  if (days < 7) return `vor ${days} Tagen`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "vor 1 Woche" : `vor ${weeks} Wochen`;
  const months = Math.floor(days / 30);
  return months === 1 ? "vor 1 Monat" : `vor ${months} Monaten`;
}

function decisionLabel(decision: SwipeDecision) {
  if (decision === "keep") return { text: "KEEP", color: "text-emerald-500 border-emerald-500" };
  if (decision === "leave") return { text: "LEAVE", color: "text-rose-500 border-rose-500" };
  return { text: "SAVE", color: "text-amber-500 border-amber-500" };
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-800">{value}</p>
    </div>
  );
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
      className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-xl shadow-neutral-300/50"
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

        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          @{post.tracked_accounts.username}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <p className="font-serif text-lg italic leading-snug text-neutral-900">
          „{post.hook ?? post.caption ?? "Kein Hook erkannt"}“
        </p>

        <div className="grid grid-cols-4 gap-2 rounded-lg bg-neutral-50 p-3">
          <StatCell label="Typ" value={formatMediaType(post.media_type)} />
          <StatCell label="Reichweite" value={formatCount(post.view_count)} />
          <StatCell label="Alter" value={formatAge(post.posted_at)} />
          <StatCell
            label="Interakt."
            value={formatCount((post.like_count ?? 0) + (post.comment_count ?? 0))}
          />
        </div>

        {post.why_it_works && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Warum es funktioniert
            </p>
            <p className="mt-1 text-xs text-neutral-700">{post.why_it_works}</p>
          </div>
        )}

        <p className="line-clamp-2 whitespace-pre-line text-xs text-neutral-500">
          {post.caption}
        </p>
        <p className="mt-auto text-[11px] font-semibold uppercase tracking-wide text-neutral-500">▶ Antippen für Video/Vollbild</p>
      </div>
    </motion.div>
  );
}

export function SwipeDeck({ initialPosts }: { initialPosts: PostWithAccount[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [expandedPost, setExpandedPost] = useState<PostWithAccount | null>(null);
  const [lastAction, setLastAction] = useState<{
    post: PostWithAccount;
    decision: SwipeDecision;
  } | null>(null);
  const [undoing, setUndoing] = useState(false);

  const recordSwipe = useCallback(async (postId: string, decision: SwipeDecision) => {
    await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, decision }),
    });
  }, []);

  const handleSwiped = useCallback(
    (post: PostWithAccount, decision: SwipeDecision) => {
      recordSwipe(post.id, decision);
      setLastAction({ post, decision });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    },
    [recordSwipe]
  );

  const handleUndo = useCallback(async () => {
    if (!lastAction || undoing) return;
    setUndoing(true);
    await fetch(`/api/swipe?post_id=${lastAction.post.id}`, { method: "DELETE" });
    setPosts((prev) => [lastAction.post, ...prev]);
    setLastAction(null);
    setUndoing(false);
  }, [lastAction, undoing]);

  const topPost = posts[0];

  const handleButton = useCallback(
    (decision: SwipeDecision) => {
      if (topPost) handleSwiped(topPost, decision);
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
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) handleUndo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [topPost, handleButton, expandedPost, handleUndo]);

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
        {lastAction && (
          <button
            onClick={handleUndo}
            className="mt-4 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
          >
            ↺ Letzten Swipe rückgängig machen
          </button>
        )}
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
                onSwiped={(decision) => handleSwiped(post, decision)}
                onExpand={() => setExpandedPost(post)}
              />
            </div>
          ))
          .reverse()}
      </div>

      <div className="flex items-end gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => handleButton("leave")}
            aria-label="Leave"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl text-rose-500 shadow-md shadow-rose-200/60 ring-1 ring-rose-200 transition hover:scale-110 hover:bg-rose-50 active:scale-95"
          >
            ✕
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Leave
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={!lastAction || undoing}
            aria-label="Zurück"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-neutral-500 shadow-md shadow-neutral-200/60 ring-1 ring-neutral-200 transition hover:scale-110 hover:bg-neutral-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
          >
            ↺
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Zurück
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => handleButton("save")}
            aria-label="Save"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-xl text-white shadow-md shadow-amber-300/50 transition hover:scale-110 hover:bg-amber-600 active:scale-95"
          >
            ★
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Save
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => handleButton("keep")}
            aria-label="Keep"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-xl text-white shadow-md shadow-neutral-400/40 transition hover:scale-110 hover:bg-black active:scale-95"
          >
            ✓
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Keep
          </span>
        </div>
      </div>
      <p className="text-xs text-neutral-400">
        Ziehen oder Pfeiltasten: ← Leave · → Keep · ↑ Save · ⌘Z Zurück · Bild antippen für Details
      </p>

      {expandedPost && (
        <PostLightbox post={expandedPost} onClose={() => setExpandedPost(null)} />
      )}
    </div>
  );
}
