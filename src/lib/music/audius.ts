import type { MusicProvider, Track } from "./types";
import { trackKey } from "./types";

/**
 * Audius. No API key, and streams as audio/mpeg with byte-range support —
 * which is what makes seeking, and therefore the sync engine, possible.
 */
const APP_NAME = "musichat";
const DISCOVERY = "https://api.audius.co";

type AudiusTrack = {
  id: string;
  title: string;
  duration: number; // seconds
  genre?: string;
  is_streamable?: boolean;
  user?: { name?: string; handle?: string };
  artwork?: Record<string, string> | null;
  permalink?: string;
  license?: string | null;
};

/**
 * Audius is a network of nodes rather than one host, so the endpoint has to be
 * discovered. Cached for an hour — re-resolving per request would add a round
 * trip to every search.
 */
let hostCache: { host: string; expires: number } | null = null;

async function getHost(): Promise<string> {
  if (hostCache && hostCache.expires > Date.now()) return hostCache.host;

  try {
    const res = await fetch(DISCOVERY, { next: { revalidate: 3600 } });
    const { data } = (await res.json()) as { data: string[] };
    const host = data?.[0];
    if (host) {
      hostCache = { host, expires: Date.now() + 3600_000 };
      return host;
    }
  } catch {
    // Fall through to the discovery host, which also serves the API.
  }
  return DISCOVERY;
}

function toTrack(t: AudiusTrack): Track {
  return {
    id: trackKey("audius", t.id),
    provider: "audius",
    providerTrackId: t.id,
    title: t.title?.trim() || "Untitled",
    artist: t.user?.name?.trim() || t.user?.handle || "Unknown artist",
    artworkUrl: t.artwork?.["480x480"] ?? t.artwork?.["150x150"] ?? null,
    durationMs: (t.duration ?? 0) * 1000,
    license: t.license ?? null,
    sourceUrl: t.permalink ? `https://audius.co${t.permalink}` : null,
  };
}

export const audiusProvider: MusicProvider = {
  id: "audius",
  label: "Audius",

  async search(query, limit) {
    const host = await getHost();
    const url = `${host}/v1/tracks/search?query=${encodeURIComponent(
      query,
    )}&limit=${limit}&app_name=${APP_NAME}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const { data } = (await res.json()) as { data?: AudiusTrack[] };

    return (data ?? [])
      .filter((t) => t.is_streamable !== false && t.duration > 0)
      .map(toTrack);
  },

  async resolveStreamUrl(providerTrackId) {
    const host = await getHost();
    // The endpoint redirects to a storage node; the browser follows it and
    // issues its range requests against the final URL.
    return `${host}/v1/tracks/${encodeURIComponent(
      providerTrackId,
    )}/stream?app_name=${APP_NAME}`;
  },
};
