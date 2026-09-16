import type { TrackRef } from "@/lib/messages";

export type SessionStatus = "active" | "ended";

export type ListeningSession = {
  id: string;
  friendshipId: string;
  startedBy: string;
  status: SessionStatus;
  trackRef: TrackRef | null;
  durationMs: number;
  isPlaying: boolean;
  /** Anchor position, in ms. */
  positionMs: number;
  /** Server time at which positionMs was true. */
  positionUpdatedAt: string;
  seq: number;
  lastActionBy: string | null;
  lastAction: string | null;
};

type Row = {
  id: string;
  friendship_id: string;
  started_by: string;
  status: SessionStatus;
  track_ref: TrackRef | null;
  duration_ms: number;
  is_playing: boolean;
  position_ms: number;
  position_updated_at: string;
  seq: number;
  last_action_by: string | null;
  last_action: string | null;
};

export const SESSION_COLUMNS =
  "id, friendship_id, started_by, status, track_ref, duration_ms, is_playing, position_ms, position_updated_at, seq, last_action_by, last_action";

export function toSession(row: Row): ListeningSession {
  return {
    id: row.id,
    friendshipId: row.friendship_id,
    startedBy: row.started_by,
    status: row.status,
    trackRef: row.track_ref,
    durationMs: row.duration_ms,
    isPlaying: row.is_playing,
    positionMs: row.position_ms,
    positionUpdatedAt: row.position_updated_at,
    seq: Number(row.seq),
    lastActionBy: row.last_action_by,
    lastAction: row.last_action,
  };
}

/**
 * Where the song should be right now, computed from the anchor
 * (ARCHITECTURE.md §6.2).
 *
 * `serverNow` is this device's local clock corrected by its measured offset,
 * so both devices arrive at the same answer despite disagreeing about the time.
 */
export function expectedPosition(
  session: ListeningSession,
  serverNow: number,
): number {
  const anchor = new Date(session.positionUpdatedAt).getTime();
  const raw = session.isPlaying
    ? session.positionMs + (serverNow - anchor)
    : session.positionMs;

  const capped = session.durationMs > 0 ? Math.min(raw, session.durationMs) : raw;
  return Math.max(0, capped);
}

/** Message shown under the player, naming who did what (FR-M5). */
export function describeAction(
  session: ListeningSession,
  meId: string,
  partnerName: string,
): string | null {
  if (!session.lastAction || !session.lastActionBy) return null;
  const who = session.lastActionBy === meId ? "You" : partnerName;

  switch (session.lastAction) {
    case "start":
      return `${who} started the session`;
    case "play":
      return `${who} pressed play`;
    case "pause":
      return `${who} paused`;
    case "seek":
      return `${who} skipped ahead`;
    case "track":
      return `${who} changed the track`;
    case "end":
      return `${who} ended the session`;
    default:
      return null;
  }
}
