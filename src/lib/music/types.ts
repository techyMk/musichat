/**
 * The provider abstraction from ARCHITECTURE.md §8.
 *
 * Everything that plays audio goes through this, so adding a source — the
 * user's own uploads next, a linked Spotify account later — never touches the
 * player or the sync engine.
 */

export type ProviderId = "audius" | "archive" | "upload";

export type Track = {
  /** Globally unique: "audius:9OoxA". What gets stored on a message or session. */
  id: string;
  provider: ProviderId;
  providerTrackId: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationMs: number;
  /**
   * Licence and a link back to the source. Creative Commons requires
   * attribution, so this is a functional requirement and not a footnote
   * (PRD §8.4).
   */
  license: string | null;
  sourceUrl: string | null;
};

export interface MusicProvider {
  readonly id: ProviderId;
  readonly label: string;
  search(query: string, limit: number): Promise<Track[]>;
  /**
   * Resolves a playable audio URL. Kept separate from search because some
   * providers need an extra lookup, and because URLs can expire — playback
   * resolves at the moment of pressing play, not minutes earlier.
   */
  resolveStreamUrl(providerTrackId: string): Promise<string | null>;
}

export function trackKey(provider: ProviderId, providerTrackId: string) {
  return `${provider}:${providerTrackId}`;
}

export function parseTrackKey(key: string) {
  const i = key.indexOf(":");
  if (i < 0) return null;
  return {
    provider: key.slice(0, i) as ProviderId,
    providerTrackId: key.slice(i + 1),
  };
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
