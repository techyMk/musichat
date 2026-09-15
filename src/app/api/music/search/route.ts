import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { searchAll } from "@/lib/music/providers";

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
    const result = await searchAll(query, 10);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=120" },
    });
  } catch {
    return NextResponse.json(
      { error: "Search didn't work. Try again." },
      { status: 502 },
    );
  }
}
