"use client";

import { useState, useMemo } from "react";
import type { PostWithAccount } from "@/lib/types";

function formatCount(n: number | null) {
  if (n === null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function parseRecipeFromCaption(caption: string | null): { title: string; ingredients: string[]; instructions: string[] } | null {
  if (!caption) return null;

  const lines = caption.split('\n').map(l => l.trim()).filter(Boolean);

  let title = '';
  let ingredients: string[] = [];
  let instructions: string[] = [];
  let section = 'title';

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes('zutat') || lower.includes('ingredient') || lower.includes('zutaten')) {
      section = 'ingredients';
      continue;
    }
    if (lower.includes('anleitung') || lower.includes('zubereitung') || lower.includes('instruction') || lower.includes('schritt')) {
      section = 'instructions';
      continue;
    }
    if (lower.includes('nährwert') || lower.includes('kcal') || lower.includes('kalorien')) {
      section = 'nutrition';
      continue;
    }

    if (section === 'title' && !title && line.length < 100) {
      title = line;
    } else if (section === 'ingredients' && (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line) || /^[a-z]/.test(line[0]))) {
      ingredients.push(line.replace(/^[-•\d.]\s*/, ''));
    } else if (section === 'instructions' && (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line) || /^[a-z]/.test(line[0]))) {
      instructions.push(line.replace(/^[-•\d.]\s*/, ''));
    }
  }

  if (!title && ingredients.length === 0 && instructions.length === 0) return null;

  return { title: title || 'Rezept', ingredients, instructions };
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

  const isRecipeView = selectedLabel === "Rezept";

  return (
    <div className="space-y-4">
      {/* Label Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
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

      {/* Recipe View */}
      {isRecipeView && filteredPosts.length > 0 ? (
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const recipe = parseRecipeFromCaption(post.caption);
            return (
              <div
                key={post.id}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Image */}
                  <div className="md:col-span-1">
                    {post.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.thumbnail_url}
                        alt={post.hook ?? ""}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Recipe Details */}
                  <div className="md:col-span-2 flex flex-col gap-4 p-4">
                    {/* Header */}
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">
                        {recipe?.title || post.hook || "Rezept"}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        @{post.tracked_accounts.username}
                      </p>
                    </div>

                    {/* Ingredients */}
                    {recipe?.ingredients && recipe.ingredients.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-700 mb-2">Zutaten:</h4>
                        <ul className="space-y-1">
                          {recipe.ingredients.map((ingredient, i) => (
                            <li key={i} className="text-xs text-neutral-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    {recipe?.instructions && recipe.instructions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-700 mb-2">Anleitung:</h4>
                        <ol className="space-y-1">
                          {recipe.instructions.map((instruction, i) => (
                            <li key={i} className="text-xs text-neutral-600 flex items-start">
                              <span className="mr-2 font-semibold">{i + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Stats & Link */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-auto">
                      <p className="text-[10px] text-neutral-400">
                        ❤️ {formatCount(post.like_count)} · 💬 {formatCount(post.comment_count)}
                      </p>
                      <a
                        href={post.permalink ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition"
                      >
                        Video ansehen →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="text-sm text-neutral-500">Keine Posts mit diesem Label.</p>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2">
          {filteredPosts.map((post) => (
            <a
              key={post.id}
              href={post.permalink ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
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
              <div className="flex flex-1 flex-col p-1">
                <p className="truncate text-[9px] font-semibold text-neutral-900">
                  @{post.tracked_accounts.username}
                </p>
                <p className="line-clamp-1 text-[9px] text-neutral-600">{post.hook}</p>
                {post.label && (
                  <p className="mt-0.5 inline-block truncate rounded bg-neutral-100 px-1 py-0.5 text-[7px] font-semibold text-neutral-600">
                    {post.label}
                  </p>
                )}
                <p className="mt-auto text-[7px] text-neutral-400">
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
