"use client";

import { useState } from "react";

export function LabelButton({ count }: { count: number }) {
  const [loading, setLoading] = useState(false);

  async function handleLabel() {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze-saved", { method: "POST" });
      const data = await response.json();
      alert(`✅ ${data.analyzed || 0} Posts gelabelt!`);
      window.location.reload();
    } catch (err) {
      alert("❌ Fehler beim Labeln");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLabel}
      disabled={loading}
      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800 disabled:opacity-50"
    >
      {loading ? "Labelt..." : `Label ${count} Posts`}
    </button>
  );
}
