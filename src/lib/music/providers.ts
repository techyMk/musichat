import type { MusicProvider, ProviderId, Track } from "./types";
import { audiusProvider } from "./audius";
import { archiveProvider } from "./archive";

/**
 * Two providers from day one, so neither is a single point of failure
 * (ARCHITECTURE.md §11). Uploads join this list next.
 */
const PROVIDERS: MusicProvider[] = [audiusProvider, archiveProvider];

export function getProvider(id: ProviderId): MusicProvider | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

/**
 * Searches every provider at once and interleaves the results.
 *
 * Interleaved rather than concatenated because concatenating buries the second
 * provider below a full page of the first — which is how a catalogue quietly
 * becomes single-source. One slow or failing provider never blocks the others.
 */
export async function searchAll(query: string, perProvider = 10) {
  const settled = await Promise.allSettled(
    PROVIDERS.map((p) => p.search(query, perProvider)),
  );

  const lists = settled.map((r) => (r.status === "fulfilled" ? r.value : []));
  const failed = PROVIDERS.filter((_, i) => settled[i].status === "rejected").map(
    (p) => p.label,
  );

  const merged: Track[] = [];
  const depth = Math.max(0, ...lists.map((l) => l.length));

  for (let i = 0; i < depth; i++) {
    for (const list of lists) {
      if (list[i]) merged.push(list[i]);
    }
  }

  return { tracks: merged, failed };
}
