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
    const res = await fetch("/api/analyze", { method: "POST" });
    const json = await res.json();
    setLoading(false);
    setResult(res.ok ? `${json.categorized} Hooks kategorisiert` : json.error ?? "Fehler");
    router.refresh();
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
