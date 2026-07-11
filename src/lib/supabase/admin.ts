import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for background jobs (cron sync) that run without a user session.
// Never expose this client or the service role key to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
