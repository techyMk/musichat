"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { measureClock, type Clock } from "@/lib/clock";
import {
  classifyDrift,
  correction,
  expectedPosition,
  type SessionState,
} from "@/lib/sync";

/**
 * M0.11 — the sync spike. Throwaway code.
 *
 * Its only job is to answer one question before we build three months of app
 * around the answer: can two devices on two networks hold the same song within
 * 400ms, and recover after one of them drops?
 *
 * Open this page on a laptop and a phone (phone on mobile data, not wifi).
 * Delete this directory once the question is answered.
 */

const TRACK_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const ROOM = "musichat-spike";
const DRIFT_TICK_MS = 500;
const HEARTBEAT_MS = 3000;
const RECLOCK_MS = 60_000;

const INITIAL: SessionState = {
  seq: 0,
  isPlaying: false,
  positionMs: 0,
  positionUpdatedAt: 0,
  trackUrl: TRACK_URL,
};

export default function SpikePage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [clock, setClock] = useState<Clock | null>(null);
  const [state, setState] = useState<SessionState>(INITIAL);
  const [drift, setDrift] = useState(0);
  const [worstDrift, setWorstDrift] = useState(0);
  const [lastAction, setLastAction] = useState<string>("none");
  const [status, setStatus] = useState("connecting");
  const [armed, setArmed] = useState(false);
  // Sampled by the drift loop so render never has to read a ref.
  const [readout, setReadout] = useState({ expected: 0, actual: 0 });

  // Intervals read these, and would otherwise capture stale values.
  const clockRef = useRef<Clock | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const serverNow = useCallback(
    () => Date.now() + (clockRef.current?.offset ?? 0),
    [],
  );

  /* ---------------- clock ---------------- */

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const c = await measureClock();
        if (alive) setClock(c);
      } catch {
        /* keep the previous offset; a failed measurement is not fatal */
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

  const publish = useCallback((next: SessionState) => {
    setState(next);
    stateRef.current = next;
    void channelRef.current?.send({
      type: "broadcast",
      event: "state",
      payload: next,
    });
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client.channel(ROOM, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      const incoming = payload as SessionState;
      // Last write wins. Anything older than what we have is discarded
      // silently rather than fought over.
      if (incoming.seq <= stateRef.current.seq) return;
      stateRef.current = incoming;
      setState(incoming);
    });

    channel.subscribe((s) => setStatus(s.toLowerCase()));
    channelRef.current = channel;

    // Rebroadcast periodically so a device that joins or reconnects picks up
    // the current state without any explicit handshake.
    const beat = setInterval(() => {
      if (stateRef.current.seq > 0) {
        void channel.send({
          type: "broadcast",
          event: "state",
          payload: stateRef.current,
        });
      }
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(beat);
      void client.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  /* ---------------- enforce play/pause ---------------- */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !armed) return;

    if (state.isPlaying && audio.paused) {
      audio.currentTime = expectedPosition(state, serverNow()) / 1000;
      void audio.play().catch(() => setArmed(false));
    } else if (!state.isPlaying && !audio.paused) {
      audio.pause();
      audio.playbackRate = 1;
      audio.currentTime = state.positionMs / 1000;
    }
  }, [state, armed, serverNow]);

  /* ---------------- drift correction ---------------- */

  useEffect(() => {
    const id = setInterval(() => {
      const audio = audioRef.current;
      const current = stateRef.current;
      if (!audio) return;

      const expected = expectedPosition(current, serverNow());
      const actual = audio.currentTime * 1000;
      setReadout({ expected, actual });

      // Drift is only meaningful while the song is actually moving.
      if (!current.isPlaying || audio.paused) return;

      const d = actual - expected;
      setDrift(d);
      setWorstDrift((w) => (Math.abs(d) > Math.abs(w) ? d : w));

      const fix = correction(d);
      audio.playbackRate = fix.playbackRate;
      if (fix.action === "seek") audio.currentTime = expected / 1000;
      setLastAction(fix.action);
    }, DRIFT_TICK_MS);

    return () => clearInterval(id);
  }, [serverNow]);

  /* ---------------- commands ---------------- */

  const command = useCallback(
    (mutate: (now: number, pos: number) => Partial<SessionState>) => {
      const now = serverNow();
      const pos = expectedPosition(stateRef.current, now);
      publish({
        ...stateRef.current,
        ...mutate(now, pos),
        seq: stateRef.current.seq + 1,
        positionUpdatedAt: now,
      });
    },
    [publish, serverNow],
  );

  const togglePlay = () =>
    command((_now, pos) => ({
      isPlaying: !stateRef.current.isPlaying,
      positionMs: pos,
    }));

  const seekBy = (deltaMs: number) =>
    command((_now, pos) => ({ positionMs: Math.max(0, pos + deltaMs) }));

  const restart = () => command(() => ({ positionMs: 0 }));

  /** iOS and Android refuse to start audio without a user gesture. A remote
   *  PLAY arriving before any local tap will silently fail — so we unlock the
   *  element once, deliberately. The real app needs this too. */
  const arm = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      setArmed(true);
    } catch {
      setStatus("audio blocked — tap again");
    }
  };

  /* ---------------- render ---------------- */

  if (!supabaseConfigured) {
    return (
      <main className="mx-auto max-w-lg p-8 text-[#F2EFFB]">
        <h1 className="mb-3 text-2xl font-bold">Supabase not configured</h1>
        <p className="mb-4 text-[#ADA5C8]">
          Copy <code className="text-[#FF4F97]">.env.example</code> to{" "}
          <code className="text-[#FF4F97]">.env.local</code>, paste your project
          URL and anon key, then restart the dev server.
        </p>
      </main>
    );
  }

  const quality = classifyDrift(drift);
  const driftColour =
    quality === "synced"
      ? "#4FD6A4"
      : quality === "catching-up"
        ? "#FFC24B"
        : "#F94545";

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <audio ref={audioRef} src={TRACK_URL} preload="auto" />

      <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-[#756D93] uppercase">
        M0.11 · sync spike · throwaway
      </p>
      <h1 className="mb-6 text-2xl font-bold text-[#F2EFFB]">
        Two devices, one song
      </h1>

      {!armed && (
        <button
          onClick={arm}
          className="mb-6 w-full rounded-full bg-[linear-gradient(100deg,#3B8DFF,#A24DEE,#FF4F97,#FF8A45)] py-3.5 font-bold text-white"
        >
          Tap to enable audio
        </button>
      )}

      <div
        className="mb-6 rounded-2xl border border-[#352E5C] bg-[#1D1936] p-5 text-center"
        aria-live="polite"
      >
        <div className="text-[11px] font-bold tracking-[0.14em] text-[#756D93] uppercase">
          Drift
        </div>
        <div
          className="my-1 text-5xl font-bold tabular-nums"
          style={{ color: driftColour }}
        >
          {drift >= 0 ? "+" : ""}
          {Math.round(drift)}
          <span className="text-2xl">ms</span>
        </div>
        <div className="text-xs text-[#ADA5C8]">
          worst {Math.round(worstDrift)}ms · correction {lastAction}
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <Btn onClick={() => seekBy(-10_000)}>−10s</Btn>
        <Btn onClick={togglePlay} primary>
          {state.isPlaying ? "Pause" : "Play"}
        </Btn>
        <Btn onClick={() => seekBy(10_000)}>+10s</Btn>
        <Btn onClick={restart}>⟲</Btn>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
        <Row label="Channel" value={status} />
        <Row label="Sequence" value={String(state.seq)} />
        <Row
          label="Clock offset"
          value={clock ? `${Math.round(clock.offset)}ms` : "measuring…"}
        />
        <Row label="Latency" value={clock ? `${clock.rtt}ms rtt` : "—"} />
        <Row label="Expected" value={fmt(readout.expected)} />
        <Row label="Actual" value={fmt(readout.actual)} />
      </dl>

      <p className="mt-8 text-[13px] leading-relaxed text-[#756D93]">
        Open this page on both devices. Put the phone on mobile data so you are
        testing two real networks. Play, seek, and pause from each device in
        turn, then switch one device&apos;s connection off for a minute and back
        on. Drift should settle under 400ms every time.
      </p>
    </main>
  );
}

function Btn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full py-3 text-sm font-bold ${
        primary
          ? "bg-[linear-gradient(100deg,#3B8DFF,#A24DEE,#FF4F97,#FF8A45)] text-white"
          : "border border-[#352E5C] text-[#F2EFFB]"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[#756D93]">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-[#F2EFFB]">
        {value}
      </dd>
    </>
  );
}

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
