"use client";

import { useEffect, useState } from "react";

type ArchivedIdea = {
  id: string;
  title: string;
  hook: string;
  reasoning: string;
  theme: string;
  created_at: string;
};

export function IdeasArchive() {
  const [ideas, setIdeas] = useState<ArchivedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    async function loadIdeas() {
      try {
        const res = await fetch("/api/ideas-archive");
        const json = await res.json();
        if (res.ok) {
          setIdeas(json.ideas ?? []);
        }
      } catch (err) {
        console.error("Failed to load ideas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadIdeas();
  }, []);

  const themes = Array.from(new Set(ideas.map((i) => i.theme)));
  const filteredIdeas = selectedTheme ? ideas.filter((i) => i.theme === selectedTheme) : ideas;
  const groupedByDate = new Map<string, ArchivedIdea[]>();

  filteredIdeas.forEach((idea) => {
    const date = new Date(idea.created_at).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groupedByDate.has(date)) {
      groupedByDate.set(date, []);
    }
    groupedByDate.get(date)!.push(idea);
  });

  if (loading) {
    return <p className="text-sm text-neutral-500">Lade Archiv...</p>;
  }

  if (ideas.length === 0) {
    return <p className="text-sm text-neutral-500">Noch keine Ideen gespeichert.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Theme Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTheme(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            selectedTheme === null
              ? "bg-neutral-900 text-white"
              : "border border-neutral-200 text-neutral-700 hover:border-neutral-300"
          }`}
        >
          Alle ({ideas.length})
        </button>
        {themes.map((theme) => (
          <button
            key={theme}
            onClick={() => setSelectedTheme(theme)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedTheme === theme
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 text-neutral-700 hover:border-neutral-300"
            }`}
          >
            {theme} ({ideas.filter((i) => i.theme === theme).length})
          </button>
        ))}
      </div>

      {/* Ideas grouped by date */}
      {Array.from(groupedByDate.entries()).map(([date, dateIdeas]) => (
        <div key={date}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {date}
          </h3>
          <ul className="space-y-2">
            {dateIdeas.map((idea) => (
              <li
                key={idea.id}
                className="rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                        {idea.title}
                      </span>
                      <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                        {idea.theme}
                      </span>
                    </div>
                    <p className="font-serif text-sm italic text-neutral-900">„{idea.hook}"</p>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                      {idea.reasoning}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(idea.hook);
                    }}
                    className="flex-shrink-0 rounded bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-200"
                  >
                    Kopieren
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
