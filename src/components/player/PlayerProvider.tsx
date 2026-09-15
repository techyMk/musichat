"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Track } from "@/lib/music/types";

/**
 * The audio engine.
 *
 * One <audio> element, owned by the app layout, so music keeps playing while
 * you move between conversations — the core promise from PRD FR-MP4. Mounting
 * it inside a page would tear it down on every navigation.
 *
 * Playback is solo for now. M5 replaces the local `position` with one computed
 * from a server anchor, and routes these same controls through the session.
 */

type PlayerState = {
  track: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  loading: boolean;
  error: string | null;
  /** Full-player sheet visibility. */
  expanded: boolean;
};

type PlayerApi = PlayerState & {
  play: (track: Track) => void;
  toggle: () => void;
  seek: (ms: number) => void;
  stop: () => void;
  setExpanded: (open: boolean) => void;
};

const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    track: null,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    loading: false,
    error: null,
    expanded: false,
  });

  const patch = useCallback(
    (next: Partial<PlayerState>) => setState((s) => ({ ...s, ...next })),
    [],
  );

  /* ---------------- audio element ---------------- */

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () =>
      setState((s) => ({ ...s, positionMs: audio.currentTime * 1000 }));
    const onMeta = () =>
      setState((s) => ({
        ...s,
        durationMs: Number.isFinite(audio.duration)
          ? audio.duration * 1000
          : s.durationMs,
      }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true, loading: false }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onWaiting = () => setState((s) => ({ ...s, loading: true }));
    const onPlaying = () => setState((s) => ({ ...s, loading: false }));
    const onEnded = () =>
      setState((s) => ({ ...s, isPlaying: false, positionMs: 0 }));
    const onError = () =>
      setState((s) => ({
        ...s,
        loading: false,
        isPlaying: false,
        error: "That track wouldn't play. Try another.",
      }));

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  /* ---------------- controls ---------------- */

  const play = useCallback(
    (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;

      patch({
        track,
        loading: true,
        error: null,
        positionMs: 0,
        durationMs: track.durationMs,
        isPlaying: false,
      });

      audio.src = `/api/music/stream/${track.provider}/${encodeURIComponent(
        track.providerTrackId,
      )}`;
      audio.currentTime = 0;

      // play() rejects when the browser has not been given a gesture yet. The
      // caller is always a tap, so this only fires in genuinely blocked cases.
      void audio.play().catch(() => {
        patch({
          loading: false,
          isPlaying: false,
          error: "Your browser blocked playback. Tap play to start it.",
        });
      });
    },
    [patch],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.track) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }, [state.track]);

  const seek = useCallback((ms: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, ms / 1000);
    setState((s) => ({ ...s, positionMs: ms }));
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setState({
      track: null,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      loading: false,
      error: null,
      expanded: false,
    });
  }, []);

  const setExpanded = useCallback(
    (open: boolean) => patch({ expanded: open }),
    [patch],
  );

  /* ---------------- lock screen controls ---------------- */

  useEffect(() => {
    if (!("mediaSession" in navigator) || !state.track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.track.title,
      artist: state.track.artist,
      album: "MusiChat",
      artwork: state.track.artworkUrl
        ? [{ src: state.track.artworkUrl, sizes: "480x480", type: "image/jpeg" }]
        : undefined,
    });

    navigator.mediaSession.setActionHandler("play", () => toggle());
    navigator.mediaSession.setActionHandler("pause", () => toggle());
  }, [state.track, toggle]);

  const value = useMemo<PlayerApi>(
    () => ({ ...state, play, toggle, seek, stop, setExpanded }),
    [state, play, toggle, seek, stop, setExpanded],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
