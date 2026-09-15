import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server client for server components, route handlers and server actions.
 * Must be created per request — never cached in a module-level variable, or
 * one user's session would leak into another's request.
 */
export async function createClient() {
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
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server components cannot set cookies. Harmless here: the
            // middleware refreshes the session on every request, so the
            // cookie is already current by the time we read it.
          }
        },
      },
    },
  );
}

/** The signed-in user, or null. Verified against Supabase, not just decoded. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
