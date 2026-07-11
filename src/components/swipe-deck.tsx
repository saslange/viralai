"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import type { MediaType, PostWithAccount, SwipeDecision } from "@/lib/types";

const SWIPE_THRESHOLD = 120;
const CARD_HEIGHT = 500;

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function extractHashtags(text: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/#\w+/g) || [];
  return matches;
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

function Card({
  post,
  onSwiped,
  onShowVideo,
  isTop,
}: {
  post: PostWithAccount;
  onSwiped: (decision: SwipeDecision) => void;
  onShowVideo: () => void;
  isTop: boolean;
}) {
  const controls = useAnimation();
  const [dragDecision, setDragDecision] = useState<SwipeDecision | null>(null);
  const hashtags = extractHashtags(post.caption || post.hook);

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
      className="absolute inset-0 flex gap-0 overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-xl shadow-neutral-300/50"
      style={{ touchAction: "none" }}
      drag={isTop}
      dragElastic={0.9}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
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

      {/* Left: Media */}
      <div className="relative w-1/2 min-w-0 bg-black">
        {post.thumbnail_url || post.media_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail_url ?? post.media_url ?? ""}
              alt={post.hook ?? "Instagram post"}
              className="h-full w-full object-cover"
              draggable={false}
            />
            {post.media_type === "video" && (
              <button
                onClick={onShowVideo}
                className="absolute inset-0 flex items-center justify-center hover:bg-black/20"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                  <div className="ml-1 h-0 w-0 border-y-[12px] border-l-[20px] border-y-transparent border-l-white" />
                </div>
              </button>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-500">
            Kein Bild
          </div>
        )}
      </div>

      {/* Right: Info (scrollable) */}
      <div className="flex w-1/2 min-w-0 flex-col overflow-y-auto p-4">
        {/* Hook */}
        <p className="mb-3 font-serif text-sm italic leading-snug text-neutral-900">
          "{post.hook ?? "Kein Hook erkannt"}"
        </p>

        {/* Hashtags at top */}
        {hashtags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wider text-neutral-500">Typ</p>
            <p className="mt-0.5 text-neutral-800">{formatMediaType(post.media_type)}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-neutral-500">Reichweite</p>
            <p className="mt-0.5 text-neutral-800">{formatCount(post.view_count)}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-neutral-500">Alter</p>
            <p className="mt-0.5 text-neutral-800">{formatAge(post.posted_at)}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-neutral-500">Interakt.</p>
            <p className="mt-0.5 text-neutral-800">
              {formatCount((post.like_count ?? 0) + (post.comment_count ?? 0))}
            </p>
          </div>
        </div>

        {/* Why it works */}
        {post.why_it_works && (
          <div className="mb-3 rounded bg-neutral-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Warum es funktioniert
            </p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">{post.why_it_works}</p>
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Caption
            </p>
            <p className="whitespace-pre-line text-xs leading-relaxed text-neutral-600">
              {post.caption}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function SwipeDeck({ initialPosts }: { initialPosts: PostWithAccount[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [videoPost, setVideoPost] = useState<PostWithAccount | null>(null);
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
      if (videoPost) return;
      if (!topPost) return;
      if (e.key === "ArrowRight") handleButton("keep");
      if (e.key === "ArrowLeft") handleButton("leave");
      if (e.key === "ArrowUp") handleButton("save");
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) handleUndo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [topPost, handleButton, videoPost, handleUndo]);

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
      <div className="relative w-full max-w-7xl" style={{ height: CARD_HEIGHT }}>
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
                onShowVideo={() => setVideoPost(post)}
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
        Ziehen oder Pfeiltasten: ← Leave · → Keep · ↑ Save · ⌘Z Zurück · Bild antippen für Video
      </p>

      {videoPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setVideoPost(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoPost(null)}
              className="absolute right-4 top-4 z-10 text-white hover:text-neutral-300"
            >
              ✕
            </button>
            {videoPost.media_url ? (
              videoPost.media_type === "video" ? (
                <video
                  src={videoPost.media_url}
                  poster={videoPost.thumbnail_url ?? undefined}
                  controls
                  autoPlay
                  className="h-full w-full"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={videoPost.media_url}
                  alt="Post"
                  className="max-h-[90vh] w-full object-contain"
                />
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
