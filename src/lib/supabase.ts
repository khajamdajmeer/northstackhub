import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 *
 * Deliberately built on the secret key, not the publishable one. Every table in
 * `supabase/schema.sql` has RLS enabled with no policy attached, so the
 * publishable key can read nothing — the secret key bypasses RLS and is the
 * only way in. That means this module must never reach the browser, hence
 * `server-only` at the top and the unprefixed env var names.
 *
 * The database is reached over PostgREST rather than a Postgres socket on
 * purpose: the project's `db.*` hostname resolves to IPv6 only, which Vercel
 * Functions cannot dial. HTTPS works from anywhere and needs no connection
 * pooling.
 */

let cached: SupabaseClient | null = null;

/**
 * Returns null when Supabase is not configured rather than throwing, so the
 * public contact form keeps working (falling back to email and a logged
 * enquiry) on a deployment that has no database wired up yet.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) return null;

  cached = createClient(url, secretKey, {
    auth: {
      // No Supabase Auth in play: the console signs in against
      // ADMIN_EMAIL / ADMIN_PASSWORD_HASH, so there is no session to persist
      // or refresh, and doing either would be a wasted request per call.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}

/** For code paths that cannot meaningfully continue without a database. */
export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

/**
 * True when the failure is "this table does not exist" rather than a real
 * error.
 *
 * Connected-but-unmigrated is a normal state on a fresh environment, and it
 * should show the operator how to fix it rather than a 500. PostgREST reports
 * it as PGRST205 with a "schema cache" message; the text is matched too because
 * the code is not always carried through the client's error shape.
 */
export function isMissingTableError(error: unknown): boolean {
  if (!error) return false;

  const code = (error as { code?: string }).code;
  if (code === "PGRST205" || code === "42P01") return true;

  const message = error instanceof Error ? error.message : String(error);
  return /schema cache|does not exist|Could not find the table/i.test(message);
}
