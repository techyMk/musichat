import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { searchAll } from "@/lib/music/providers";
import { searchUploads } from "@/lib/music/uploads";

/**
 * Search proxy.
 *
 * Runs server-side so provider hosts and any future API keys never reach the
 * browser (SEC-9), and so the response shape stays ours rather than each
 * provider's.
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ tracks: [], failed: [] });
  }

  try {
    const supabase = await createClient();

    // Uploads cannot go through the stateless provider list — every result
    // depends on who is asking — so they are merged here, and placed first
    // because a track you deliberately added is what you most likely meant.
    const [uploads, catalogue] = await Promise.all([
      searchUploads(supabase, query, 5).catch(() => []),
      searchAll(query, 10),
    ]);

    return NextResponse.json(
      { tracks: [...uploads, ...catalogue.tracks], failed: catalogue.failed },
      { headers: { "Cache-Control": "private, max-age=120" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Search didn't work. Try again." },
      { status: 502 },
    );
  }
}
