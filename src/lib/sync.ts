/**
 * Shared session state and drift policy (ARCHITECTURE.md §6.2–6.4).
 *
 * The position is never stored as a continuously ticking number. It is stored
 * as an anchor — a position, and the server time that position was true. Where
 * the song *should* be right now is always computed from those two values,
 * which is what makes reconnecting after two minutes offline trivial.
 */

export type SessionState = {
  /** Monotonic. Higher always wins — this is how two controllers resolve. */
  seq: number;
  isPlaying: boolean;
  /** Position at the anchor moment, in ms. */
  positionMs: number;
  /** Server time when positionMs was true, in ms. */
  positionUpdatedAt: number;
  trackUrl: string;
};

/** Where the song should be right now, according to the anchor. */
export function expectedPosition(
  state: SessionState,
  serverNow: number,
): number {
  if (!state.isPlaying) return state.positionMs;
  return state.positionMs + (serverNow - state.positionUpdatedAt);
}

export const DRIFT = {
  /** Below this, leave it alone. Nobody can hear it. */
  ignore: 150,
  /** Up to this, correct gradually by nudging playback rate. */
  nudge: 400,
  /** Past 2s we stop claiming to be in sync at all. */
  lost: 2000,
} as const;

export type SyncQuality = "synced" | "catching-up" | "off";

export function classifyDrift(driftMs: number): SyncQuality {
  const d = Math.abs(driftMs);
  if (d <= DRIFT.ignore) return "synced";
  if (d <= DRIFT.nudge) return "catching-up";
  return "off";
}

/**
 * What to do about the measured drift.
 *
 * Positive drift means we are ahead of where we should be, so we slow down.
 * A 2% rate change is inaudible; a seek is not, which is why seeking is the
 * last resort rather than the first.
 */
export function correction(driftMs: number): {
  action: "none" | "nudge" | "seek";
  playbackRate: number;
} {
  const d = Math.abs(driftMs);

  if (d <= DRIFT.ignore) return { action: "none", playbackRate: 1 };
  if (d <= DRIFT.nudge) {
    return { action: "nudge", playbackRate: driftMs > 0 ? 0.98 : 1.02 };
  }
  return { action: "seek", playbackRate: 1 };
}
