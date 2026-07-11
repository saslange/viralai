"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnalyzeButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setResult(json?.error ?? `Fehler (Status ${res.status})`);
      } else {
        setResult(`${json?.categorized ?? 0} Postings analysiert`);
      }
      router.refresh();
    } catch {
      setResult("Netzwerkfehler — nochmal versuchen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:scale-105 hover:bg-black active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? "Analysiere…" : "Neue Postings analysieren"}
      </button>
      {result && <span className="text-xs text-neutral-500">{result}</span>}
    </div>
  );
}
