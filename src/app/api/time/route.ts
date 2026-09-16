import { createClient } from "@/lib/supabase/server";

/**
 * The authoritative clock.
 *
 * Reads the DATABASE clock rather than this server's, because session anchors
 * are stamped with Postgres `now()`. Measuring offset against one clock and
 * anchoring against another would build in a drift nobody could see — and it
 * would look like a sync bug rather than a clock mismatch.
 *
 * Falls back to local time if the query fails: a slightly worse offset beats
 * no playback at all.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  let now = Date.now();
  let source = "local";

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("server_now");
    if (!error && data) {
      const parsed = new Date(data as string).getTime();
      if (Number.isFinite(parsed)) {
        now = parsed;
        source = "db";
      }
    }
  } catch {
    // Keep the local reading.
  }

  return Response.json(
    { now, source },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
