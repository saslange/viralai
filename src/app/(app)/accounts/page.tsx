import { createClient } from "@/lib/supabase/server";
import { AccountsManager } from "@/components/accounts-manager";
import type { TrackedAccount } from "@/lib/types";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("tracked_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Beobachtete Accounts</h1>
        <p className="text-sm text-neutral-400">
          Instagram-Accounts hinzufügen, deren Postings analysiert werden sollen.
        </p>
      </div>
      <AccountsManager initialAccounts={(accounts as TrackedAccount[] | null) ?? []} />
    </div>
  );
}
