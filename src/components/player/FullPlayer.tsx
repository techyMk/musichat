"use client";

import { useEffect } from "react";
import { usePlayer } from "./PlayerProvider";
import { Artwork } from "./Artwork";
import { PlayPauseIcon, SkipIcon, ChevronDownIcon } from "./controls";
import { formatDuration } from "@/lib/music/types";

const SKIP_MS = 10_000;

/**
 * DESIGN.md §5.4 — a sheet over the app, never a route.
 *
 * If the player were somewhere you navigate *to*, opening it would mean
 * leaving the conversation. As a sheet, the music sits on top and dismissing
 * it returns you exactly where you were, scroll position intact.
 *
 * Its open state is pushed onto history so the Android back gesture closes the
 * sheet instead of leaving the conversation — the detail most commonly got
 * wrong in PWAs.
 */
export function FullPlayer() {
  const {
    track,
    isPlaying,
    positionMs,
    durationMs,
    loading,
    error,
    expanded,
    toggle,
    seek,
    stop,
    setExpanded,
  } = usePlayer();

  useEffect(() => {
    if (!expanded) return;

    window.history.pushState({ player: true }, "");
    const onPop = () => setExpanded(false);
    window.addEventListener("popstate", onPop);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded, setExpanded]);

  if (!track || !expanded) return null;

  const total = durationMs || track.durationMs;
  const pct = total > 0 ? Math.min(100, (positionMs / total) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Player"
      className="fixed inset-0 z-50 flex justify-center bg-ink-900/80 backdrop-blur-md"
    >
      <div className="flex w-full max-w-md flex-col px-6 pt-3 pb-8">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close player"
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-tx-mid hover:bg-ink-700 hover:text-tx-hi"
          >
            <ChevronDownIcon />
          </button>
          <p className="flex-1 text-center text-[10px] font-bold tracking-[0.18em] text-tx-lo uppercase">
            Listening alone
          </p>
          <div className="h-10 w-10" />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <Artwork
            src={track.artworkUrl}
            alt={`${track.title} by ${track.artist}`}
            className="aspect-square w-full shadow-[0_22px_46px_-20px_rgba(255,79,151,0.4),0_22px_46px_-20px_rgba(59,141,255,0.4)]"
            rounded="rounded-[var(--r-xl)]"
          />

          <div className="mt-7 text-center">
            <h2 className="font-display text-[25px] leading-tight font-bold tracking-tight text-balance text-tx-hi">
              {track.title}
            </h2>
            <p className="mt-1 text-[13px] text-tx-mid">{track.artist}</p>
          </div>

          <div className="mt-6">
            <input
              type="range"
              min={0}
              max={Math.max(1, total)}
              value={Math.min(positionMs, total)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-600 accent-[var(--you-500)]"
              style={{
                background: `linear-gradient(to right, var(--you-500) ${pct}%, var(--ink-600) ${pct}%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-[10.5px] text-tx-lo tabular-nums">
              <span>{formatDuration(positionMs)}</span>
              <span>{formatDuration(total)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-7">
            <button
              type="button"
              onClick={() => seek(Math.max(0, positionMs - SKIP_MS))}
              aria-label="Back 10 seconds"
              className="grid h-11 w-11 place-items-center rounded-full text-tx-mid hover:text-tx-hi"
            >
              <SkipIcon direction="back" size={20} />
            </button>

            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid h-16 w-16 place-items-center rounded-full bg-[image:var(--together)] text-white shadow-[0_12px_28px_-10px_rgba(255,79,151,0.6)]"
            >
              <PlayPauseIcon playing={isPlaying} loading={loading} size={22} />
            </button>

            <button
              type="button"
              onClick={() => seek(Math.min(total, positionMs + SKIP_MS))}
              aria-label="Forward 10 seconds"
              className="grid h-11 w-11 place-items-center rounded-full text-tx-mid hover:text-tx-hi"
            >
              <SkipIcon direction="forward" size={20} />
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-5 text-center text-[12.5px] text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {/* Creative Commons requires credit, so this is functional, not
              decorative (PRD §8.4). */}
          {track.license && (
            <p className="text-center text-[11px] text-tx-lo">
              {track.license}
              {track.sourceUrl && (
                <>
                  {" · "}
                  <a
                    href={track.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-tx-mid"
                  >
                    Source
                  </a>
                </>
              )}
            </p>
          )}

          <button
            type="button"
            onClick={stop}
            className="text-[12.5px] font-semibold text-tx-lo hover:text-tx-mid"
          >
            Stop playing
          </button>
        </div>
      </div>
    </div>
  );
}
