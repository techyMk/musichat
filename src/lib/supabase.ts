import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until .env.local is filled in — the UI checks this and explains itself. */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!, {
      realtime: {
        // Playback commands are bursty: a seek drag can fire several per second.
        params: { eventsPerSecond: 20 },
      },
    })
  : null;
