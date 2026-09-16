"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerProvider";
import { Artwork } from "./Artwork";
import { PlayPauseIcon } from "./controls";
import { formatDuration, type Track } from "@/lib/music/types";

const DEBOUNCE_MS = 350;

const SUGGESTIONS = [
  "lofi",
  "carnatic",
  "jazz",
  "tamil",
  "acoustic",
  "hindustani",
  "electronic",
  "piano",
];

type Result = { tracks: Track[]; failed: string[] };

export function TrackSearch({
  /** When set, results hand the track back instead of playing it locally. */
  onPick,
  pickLabel,
}: {
  onPick?: (track: Track) => void;
  pickLabel?: string;
} = {}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const player = usePlayer();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    const controller = new AbortController();

    // Debounced, and the previous request is aborted — otherwise a slow
    // earlier query can land after a newer one and overwrite it.
    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search failed");
        setResult((await res.json()) as Result);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Search didn't work. Check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="track-search" className="sr-only">
          Search for music
        </label>
        <input
          id="track-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a song, artist or mood"
          autoComplete="off"
          className="w-full rounded-full border border-ink-500 bg-ink-700 px-5 py-3 text-[14px] text-tx-hi outline-none placeholder:text-tx-lo focus:border-you-500"
        />
      </div>

      {!query.trim() && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="rounded-full border border-ink-500 px-3.5 py-2 text-[12px] text-tx-mid transition-colors duration-[var(--dur-fast)] hover:border-tx-lo hover:text-tx-hi"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {searching && (
        <ul className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-[var(--r-md)] p-2"
            >
              <span className="h-12 w-12 shrink-0 animate-pulse rounded-[10px] bg-ink-700" />
              <span className="flex-1">
                <span className="mb-1.5 block h-3 w-2/5 animate-pulse rounded bg-ink-700" />
                <span className="block h-2.5 w-1/4 animate-pulse rounded bg-ink-700" />
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}

      {!searching && result && result.tracks.length === 0 && query.trim() && (
        <div className="rounded-[var(--r-md)] border border-ink-600 bg-ink-800/60 p-5 text-center">
          <p className="mb-1 text-[13.5px] font-bold text-tx-hi">
            Nothing for &ldquo;{query.trim()}&rdquo;
          </p>
          <p className="text-[12.5px] leading-relaxed text-tx-mid">
            The catalogue is independent artists, so big commercial releases
            won&apos;t be here. Try a mood, a genre, or an artist you know is
            independent.
          </p>
        </div>
      )}

      {!searching && result && result.tracks.length > 0 && (
        <>
          <ul className="flex flex-col gap-1">
            {result.tracks.map((track) => {
              const active = player.track?.id === track.id;
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onPick
                        ? onPick(track)
                        : active
                          ? player.toggle()
                          : player.play(track)
                    }
                    aria-label={pickLabel ? `${pickLabel}: ${track.title}` : undefined}
                    className="flex w-full items-center gap-3 rounded-[var(--r-md)] p-2 text-left transition-colors duration-[var(--dur-fast)] hover:bg-ink-700"
                  >
                    <Artwork
                      src={track.artworkUrl}
                      alt=""
                      className="h-12 w-12"
                      rounded="rounded-[10px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[13.5px] font-bold ${
                          active ? "text-you-500" : "text-tx-hi"
                        }`}
                      >
                        {track.title}
                      </span>
                      <span className="block truncate text-[12px] text-tx-mid">
                        {track.artist}
                      </span>
                    </span>
                    {track.durationMs > 0 && (
                      <span className="shrink-0 text-[11.5px] text-tx-lo tabular-nums">
                        {formatDuration(track.durationMs)}
                      </span>
                    )}
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-600 text-tx-hi">
                      <PlayPauseIcon
                        playing={active && player.isPlaying}
                        loading={active && player.loading}
                        size={15}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {result.failed.length > 0 && (
            <p className="text-[12px] text-tx-lo">
              {result.failed.join(" and ")} didn&apos;t respond, so these results
              are from the other source.
            </p>
          )}
        </>
      )}
    </div>
  );
}
