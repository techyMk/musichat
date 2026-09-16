"use client";

import { usePlayer } from "./PlayerProvider";
import { Artwork } from "./Artwork";
import { PlayPauseIcon } from "./controls";

/**
 * DESIGN.md §5.3. Docked to the bottom edge on every screen while something is
 * playing, and deliberately not dismissible — ending playback is an act you
 * perform in the full player, never an accidental swipe.
 *
 * The progress bar is the gradient along the top edge: progress and the
 * relationship are the same object.
 */
export function MiniPlayer() {
  const {
    track,
    isPlaying,
    positionMs,
    durationMs,
    loading,
    toggle,
    setExpanded,
    controller,
  } = usePlayer();

  if (!track) return null;

  const pct = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    /* Reserves its own height in the document rather than floating over the
       page. Fixed positioning was covering the message composer — a player you
       cannot dismiss must not sit on top of the thing you type into. */
    <div className="sticky bottom-0 z-40 shrink-0 px-2.5 pb-2.5 lg:px-6 lg:pb-6">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[18px] border border-ink-500 bg-ink-700/95 shadow-[0_10px_26px_-12px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] bg-ink-600"
        >
          <div
            className="h-full bg-[image:var(--together)] transition-[width] duration-200 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-3 p-2.5">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-label={`Open player — ${track.title} by ${track.artist}`}
          >
            <Artwork
              src={track.artworkUrl}
              alt=""
              className="h-11 w-11"
              rounded="rounded-[10px]"
            />
            <span className="min-w-0 flex-1">
              {/* Names the person you are listening WITH, never the chat you
                  happen to be looking at (DESIGN.md §5.3). */}
              {controller && (
                <span className="block truncate bg-[image:var(--together)] bg-clip-text text-[10px] font-bold tracking-[0.05em] text-transparent">
                  {controller.label}
                </span>
              )}
              <span className="block truncate text-[12.5px] font-bold text-tx-hi">
                {track.title}
              </span>
              <span className="block truncate text-[11.5px] text-tx-mid">
                {track.artist}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-600 text-tx-hi transition-colors duration-[var(--dur-fast)] hover:bg-ink-500"
          >
            <PlayPauseIcon playing={isPlaying} loading={loading} />
          </button>
        </div>
      </div>
    </div>
  );
}
