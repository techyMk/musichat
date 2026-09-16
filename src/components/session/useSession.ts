"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { measureClock, type Clock } from "@/lib/clock";
import { classifyDrift, correction, DRIFT, type SyncQuality } from "@/lib/sync";
import {
  toSession,
  expectedPosition,
  type ListeningSession,
} from "@/lib/session";
import { usePlayer, type PlayerController } from "@/components/player/PlayerProvider";
import type { Track } from "@/lib/music/types";
import type { TrackRef } from "@/lib/messages";

const DRIFT_TICK_MS = 500;
const RECLOCK_MS = 60_000;
/** No server contact for this long and we stop claiming to be in sync. */
const STALE_MS = 10_000;

export type SyncStatus = SyncQuality | "connecting" | "reconnecting";

function toTrack(ref: TrackRef): Track {
  return {
    id: ref.id,
    provider: ref.provider as Track["provider"],
    providerTrackId: ref.providerTrackId,
    title: ref.title,
    artist: ref.artist,
    artworkUrl: ref.artworkUrl,
    durationMs: ref.durationMs,
    license: null,
    sourceUrl: null,
  };
}

function toRef(track: Track): TrackRef {
  return {
    id: track.id,
    provider: track.provider,
    providerTrackId: track.providerTrackId,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artworkUrl,
    durationMs: track.durationMs,
  };
}

/**
 * Drives the player from a shared session.
 *
 * The three pieces the spike proved, now wired to the real player: an NTP-style
 * clock offset, a position computed from the server anchor, and graduated drift
 * correction. The spike's finding stands — a phone can be 29 seconds off, and
 * without the offset the two devices would be 29 seconds apart.
 */
export function useSession({
  friendshipId,
  meId,
  partnerName,
  initialSession,
}: {
  friendshipId: string;
  meId: string;
  partnerName: string;
  initialSession: ListeningSession | null;
}) {
  const player = usePlayer();
  const [client] = useState(() => createClient());

  const [session, setSession] = useState<ListeningSession | null>(initialSession);
  const [clock, setClock] = useState<Clock | null>(null);
  const [drift, setDrift] = useState(0);
  const [status, setStatus] = useState<SyncStatus>("connecting");
  const [busy, setBusy] = useState(false);

  const sessionRef = useRef(session);
  const clockRef = useRef(clock);
  // 0 until the first effect runs. Date.now() in a ref initialiser is an
  // impure call during render.
  const lastContactRef = useRef(0);

  useEffect(() => {
    lastContactRef.current = Date.now();
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  const serverNow = useCallback(
    () => Date.now() + (clockRef.current?.offset ?? 0),
    [],
  );

  /* ---------------- clock ---------------- */

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const measured = await measureClock();
        if (alive) setClock(measured);
      } catch {
        // Keep the previous offset — a failed measurement is not fatal.
      }
    };
    void sync();
    const id = setInterval(sync, RECLOCK_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* ---------------- realtime ---------------- */

  useEffect(() => {
    const channel = client
      .channel(`session:${friendshipId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `friendship_id=eq.${friendshipId}`,
        },
        (payload) => {
          lastContactRef.current = Date.now();
          const incoming = toSession(payload.new as never);

          // Higher seq always wins; older state is discarded silently rather
          // than fought over (ARCHITECTURE.md §6.3).
          setSession((current) =>
            current && incoming.seq <= current.seq && incoming.id === current.id
              ? current
              : incoming,
          );
        },
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          lastContactRef.current = Date.now();
          setStatus("catching-up");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          setStatus("reconnecting");
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [client, friendshipId]);

  /* ---------------- commands ---------------- */

  const command = useCallback(
    async (
      action: "start" | "play" | "pause" | "seek" | "track" | "end",
      opts: { track?: Track; seekToMs?: number } = {},
    ) => {
      setBusy(true);
      try {
        const { data, error } = await client.rpc("session_command", {
          target_friendship: friendshipId,
          action,
          track: opts.track ? toRef(opts.track) : null,
          seek_to_ms: opts.seekToMs ?? null,
        });
        if (!error && data) {
          lastContactRef.current = Date.now();
          setSession(toSession(data as never));
        }
      } finally {
        setBusy(false);
      }
    },
    [client, friendshipId],
  );

  /* ---------------- own the player while a session is live ---------------- */

  const active = session?.status === "active";

  useEffect(() => {
    if (!active) {
      player.setController(null);
      return;
    }

    const controller: PlayerController = {
      label: `Vibing with ${partnerName}`,
      onPlayTrack: (track) => void command("track", { track }),
      onToggle: () =>
        void command(sessionRef.current?.isPlaying ? "pause" : "play"),
      onSeek: (ms) => void command("seek", { seekToMs: ms }),
      onStop: () => void command("end"),
    };

    player.setController(controller);
    return () => player.setController(null);
    // player.setController is stable; re-binding on every player change would
    // thrash the controller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, partnerName, command]);

  /* ---------------- follow the session ---------------- */

  useEffect(() => {
    if (!session || session.status !== "active" || !session.trackRef) return;
    if (!clock) return; // Without an offset we cannot place the song correctly.

    player.syncTo({
      track: toTrack(session.trackRef),
      shouldPlay: session.isPlaying,
      positionMs: expectedPosition(session, serverNow()),
      hardSeek: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.seq, session?.id, clock?.offset]);

  /* ---------------- drift correction ---------------- */

  useEffect(() => {
    const id = setInterval(() => {
      const current = sessionRef.current;

      if (Date.now() - lastContactRef.current > STALE_MS) {
        setStatus("reconnecting");
      }

      if (!current || current.status !== "active" || !current.isPlaying) return;
      if (!clockRef.current) return;

      const expected = expectedPosition(current, serverNow());
      const actual = player.readActualMs();
      const d = actual - expected;
      setDrift(d);

      const fix = correction(d);
      player.setPlaybackRate(fix.playbackRate);

      if (fix.action === "seek") {
        player.syncTo({
          track: current.trackRef ? toTrack(current.trackRef) : null,
          shouldPlay: true,
          positionMs: expected,
          hardSeek: true,
        });
      }

      // Never claim sync before it has been measured true (DESIGN.md §5.5).
      if (Date.now() - lastContactRef.current <= STALE_MS) {
        setStatus(Math.abs(d) > DRIFT.lost ? "reconnecting" : classifyDrift(d));
      }
    }, DRIFT_TICK_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverNow]);

  return {
    session,
    active,
    busy,
    drift,
    clock,
    status,
    isMine: session?.lastActionBy === meId,
    start: (track: Track) => command("start", { track }),
    end: () => command("end"),
  };
}
