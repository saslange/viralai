"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { TrackedAccount } from "@/lib/types";

export function AccountFilter({ accounts }: { accounts: TrackedAccount[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("account");

  function select(id: string | null) {
    if (id) {
      router.push(`/?account=${id}`);
    } else {
      router.push("/");
    }
  }

  if (accounts.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        ★ Fokus
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => select(null)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            !activeId
              ? "bg-neutral-900 text-white shadow-md"
              : "bg-white text-neutral-500 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
          }`}
        >
          Alle
        </button>
        {accounts.map((account) => {
          const active = activeId === account.id;
          return (
            <button
              key={account.id}
              onClick={() => select(active ? null : account.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                active
                  ? "bg-neutral-900 text-white shadow-md"
                  : "bg-white text-neutral-500 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
              }`}
            >
              @{account.username}
              {active && <span className="ml-1.5 opacity-80">✕</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
