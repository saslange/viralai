"use client";

import { useState } from "react";

type ContentIdea = {
  title: string;
  hook: string;
  reasoning: string;
};

export function ContentIdeas() {
  const [ideas, setIdeas] = useState<ContentIdea[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content-ideas", { method: "POST" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error ?? `Fehler (Status ${res.status})`);
      } else {
        const generatedIdeas = json?.ideas ?? [];
        setIdeas(generatedIdeas);

        // Save ideas to archive
        for (const idea of generatedIdeas) {
          await fetch("/api/save-idea", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: idea.title,
              hook: idea.hook,
              reasoning: idea.reasoning,
              theme: extractTheme(idea.title),
            }),
          });
        }
      }
    } catch {
      setError("Netzwerkfehler — nochmal versuchen");
    } finally {
      setLoading(false);
    }
  }

  function extractTheme(title: string): string {
    const themes: { [key: string]: string } = {
      story: "Story",
      frage: "Frage",
      challenge: "Challenge",
      tipp: "Tipps",
      trend: "Trend",
      kontrover: "Kontrovers",
      hacks: "Hacks",
    };

    for (const [key, label] of Object.entries(themes)) {
      if (title.toLowerCase().includes(key)) return label;
    }
    return "Sonstiges";
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Content-Ideen für @heysash85
          </h2>
          <a
            href="/analytics/archive"
            className="mt-1 text-xs text-neutral-500 hover:text-neutral-700 underline"
          >
            Zum Archiv →
          </a>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:scale-105 hover:bg-black active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "Generiere…" : ideas ? "Neu generieren" : "Ideen generieren"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!ideas && !error && (
        <p className="text-sm text-neutral-500">
          Nutzt deine behaltenen/gemerkten Postings als Vorbild und schlägt konkrete,
          fertig formulierte Hooks für deinen eigenen Account vor.
        </p>
      )}

      {ideas && ideas.length === 0 && (
        <p className="text-sm text-neutral-500">Keine Ideen erhalten — nochmal versuchen.</p>
      )}

      {ideas && ideas.length > 0 && (
        <ul className="space-y-3">
          {ideas.map((idea, i) => (
            <li
              key={i}
              className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {idea.title}
              </p>
              <p className="mt-1 font-serif text-base italic leading-snug text-neutral-900">
                „{idea.hook}“
              </p>
              <p className="mt-2 text-xs text-neutral-600">{idea.reasoning}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
