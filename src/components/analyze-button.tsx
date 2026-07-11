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
        className="rounded-lg bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
      >
        {loading ? "Analysiere…" : "Neue Hooks analysieren"}
      </button>
      {result && <span className="text-xs text-neutral-500">{result}</span>}
    </div>
  );
}
