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
        setResult(`${json?.categorized ?? 0} Hooks kategorisiert`);
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
        className="rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-pink-500/25 transition hover:scale-105 hover:shadow-md hover:shadow-pink-500/30 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? "Analysiere…" : "Neue Hooks analysieren"}
      </button>
      {result && <span className="text-xs text-neutral-500">{result}</span>}
    </div>
  );
}
