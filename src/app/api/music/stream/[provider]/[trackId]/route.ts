import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { getProvider } from "@/lib/music/providers";
import { signUploadUrl } from "@/lib/music/uploads";
import type { ProviderId } from "@/lib/music/types";

/**
 * Resolves a track to its real audio URL and redirects there.
 *
 * A redirect rather than a proxy: the audio bytes go straight from the
 * provider's CDN to the browser, so range requests and seeking keep working
 * and we pay for none of the bandwidth. Only the lookup passes through here.
 *
 * Resolving at play time also means an expired URL is simply re-resolved on
 * the next play, instead of a session dying mid-song.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string; trackId: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { provider: providerId, trackId } = await params;

  // Uploads live in a private bucket, so the URL is signed rather than looked
  // up. RLS decides whether this listener may see the row at all.
  if (providerId === "upload") {
    const supabase = await createClient();
    const signed = await signUploadUrl(supabase, decodeURIComponent(trackId));
    if (!signed) {
      return NextResponse.json({ error: "Track unavailable" }, { status: 404 });
    }
    return NextResponse.redirect(signed, 302);
  }

  const provider = getProvider(providerId as ProviderId);

  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  try {
    const url = await provider.resolveStreamUrl(decodeURIComponent(trackId));
    if (!url) {
      return NextResponse.json(
        { error: "That track has no playable audio" },
        { status: 404 },
      );
    }
    return NextResponse.redirect(url, 302);
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the music provider" },
      { status: 502 },
    );
  }
}
