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
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        onClick={() => select(null)}
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
          !activeId
            ? "bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 text-white shadow-md shadow-pink-500/25"
            : "bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
        }`}
      >
        Alle Accounts
      </button>
      {accounts.map((account) => (
        <button
          key={account.id}
          onClick={() => select(account.id)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            activeId === account.id
              ? "bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 text-white shadow-md shadow-pink-500/25"
              : "bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
          }`}
        >
          @{account.username}
        </button>
      ))}
    </div>
  );
}
