import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until .env.local is filled in — the UI checks this and explains itself. */
export const supabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client. Sessions are stored in cookies rather than localStorage so
 * server components and middleware can read them too.
 */
export function createClient() {
  if (!supabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill it in.",
    );
  }

  return createBrowserClient(url!, anonKey!, {
    realtime: {
      // Playback commands are bursty: a seek drag fires several per second.
      params: { eventsPerSecond: 20 },
    },
  });
}
