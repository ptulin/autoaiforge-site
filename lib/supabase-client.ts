import { createBrowserClient } from "@supabase/ssr";

/** Browser-side Supabase client (uses anon key).
 *  Use in "use client" components (login page, profile page, watch button).
 *  Safe to import in Client Components — no next/headers dependency.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
