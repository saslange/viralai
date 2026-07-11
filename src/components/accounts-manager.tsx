"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TrackedAccount } from "@/lib/types";

export function AccountsManager({ initialAccounts }: { initialAccounts: TrackedAccount[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Fehler beim Hinzufügen");
    } else {
      setAccounts((prev) => [json.account, ...prev]);
      setUsername("");
      router.refresh();
    }
    setSubmitting(false);
  }

  async function handleRemove(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="z. B. heysash85 oder @username"
          required
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-neutral-400/30 transition hover:scale-[1.02] hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          Hinzufügen
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {accounts.length === 0 ? (
        <p className="text-sm text-neutral-500">Noch keine Accounts hinzugefügt.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-300 bg-white shadow-sm">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">@{account.username}</p>
                <p className="text-xs text-neutral-500">
                  {account.last_synced_at
                    ? `Zuletzt synchronisiert: ${new Date(account.last_synced_at).toLocaleString("de-DE")}`
                    : "Noch nicht synchronisiert"}
                </p>
              </div>
              <button
                onClick={() => handleRemove(account.id)}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
