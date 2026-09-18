import { createClient } from "@supabase/supabase-js";

// IMPORTANT: This client uses the SERVICE ROLE key and bypasses Row Level
// Security. Only import this inside server-only code (API routes, cron
// jobs). Never import it in a "use client" component or expose it to the
// browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}