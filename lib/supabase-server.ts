import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server-side Supabase client (uses anon key + session cookies).
 *  Use in Server Components, API route handlers, middleware.
 *  RLS is enforced — users can only see their own data.
 *
 *  For Client Components, import createSupabaseBrowserClient from
 *  @/lib/supabase-client instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — cookies() is read-only there.
            // The middleware handles refreshing the session, so this is safe to ignore.
          }
        },
      },
    }
  );
}
