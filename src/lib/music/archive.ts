import type { MusicProvider, Track } from "./types";
import { trackKey } from "./types";

/**
 * Internet Archive. No API key, and the reason it earns a slot: hundreds of
 * thousands of public-domain and freely-licensed recordings, including Carnatic
 * and Hindustani classical and old film music that Audius has almost none of.
 *
 * Search returns collection items rather than files, so the playable URL needs
 * a second lookup. That is exactly why resolveStreamUrl is separate from
 * search — doing it per result would mean an extra request per row.
 */
const SEARCH = "https://archive.org/advancedsearch.php";
const META = "https://archive.org/metadata";

type Doc = {
  identifier: string;
  title?: string | string[];
  creator?: string | string[];
  runtime?: string;
};

type ArchiveFile = {
  name: string;
  format?: string;
  length?: string; // "3:24" or seconds as a string
  source?: string;
};

const PLAYABLE = ["VBR MP3", "128Kbps MP3", "64Kbps MP3", "MP3", "Ogg Vorbis"];

function first(v: string | string[] | undefined, fallback: string) {
  if (Array.isArray(v)) return v[0]?.trim() || fallback;
  return v?.trim() || fallback;
}

/** Archive reports length as "3:24", "1:02:11", or a bare seconds string. */
function parseLength(raw?: string): number {
  if (!raw) return 0;
  if (!raw.includes(":")) return Math.round(parseFloat(raw) * 1000) || 0;
  const parts = raw.split(":").map((p) => parseFloat(p) || 0);
  const seconds = parts.reduce((acc, p) => acc * 60 + p, 0);
  return Math.round(seconds * 1000);
}

export const archiveProvider: MusicProvider = {
  id: "archive",
  label: "Internet Archive",

  async search(query, limit) {
    const q = `${query} AND mediatype:(audio)`;
    const url =
      `${SEARCH}?q=${encodeURIComponent(q)}` +
      `&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=runtime` +
      `&rows=${limit}&page=1&output=json`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const json = (await res.json()) as { response?: { docs?: Doc[] } };

    return (json.response?.docs ?? []).map(
      (d): Track => ({
        id: trackKey("archive", d.identifier),
        provider: "archive",
        providerTrackId: d.identifier,
        title: first(d.title, d.identifier),
        artist: first(d.creator, "Internet Archive"),
        artworkUrl: `https://archive.org/services/img/${encodeURIComponent(
          d.identifier,
        )}`,
        durationMs: parseLength(d.runtime),
        license: "Internet Archive",
        sourceUrl: `https://archive.org/details/${encodeURIComponent(
          d.identifier,
        )}`,
      }),
    );
  },

  async resolveStreamUrl(identifier) {
    const res = await fetch(`${META}/${encodeURIComponent(identifier)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { files?: ArchiveFile[] };
    const files = json.files ?? [];

    // Prefer the highest-quality playable encoding available.
    for (const format of PLAYABLE) {
      const match = files.find((f) => f.format === format);
      if (match) {
        return `https://archive.org/download/${encodeURIComponent(
          identifier,
        )}/${encodeURIComponent(match.name)}`;
      }
    }
    return null;
  },
};
