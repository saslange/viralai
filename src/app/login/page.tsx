"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="text-xl font-semibold text-neutral-50">heysash85 · viral lab</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Zugang nur für sash@heysash.de. Wir senden dir einen Magic Link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="sash@heysash.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {status === "sending" ? "Sende Link…" : "Magic Link senden"}
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-4 text-sm text-emerald-400">
            Link verschickt — check dein Postfach.
          </p>
        )}
        {status === "error" && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
