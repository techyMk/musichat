"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UPLOAD_LIMITS } from "@/lib/music/uploads";
import { usePlayer } from "@/components/player/PlayerProvider";
import { PlayPauseIcon } from "@/components/player/controls";
import { formatDuration } from "@/lib/music/types";
import type { Track } from "@/lib/music/types";

export type MyUpload = {
  id: string;
  title: string;
  artist: string | null;
  duration_ms: number;
  size_bytes: number;
  storage_path: string;
};

/** Reads duration from the file itself — nothing else knows how long it is. */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    const done = (ms: number) => {
      URL.revokeObjectURL(url);
      resolve(ms);
    };

    audio.addEventListener("loadedmetadata", () =>
      done(Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : 0),
    );
    // A file the browser cannot decode is not one it can play either, but let
    // the upload proceed with an unknown duration rather than blocking here.
    audio.addEventListener("error", () => done(0));
    audio.src = url;
  });
}

function prettyBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Strips the extension and tidies separators for a default title. */
function titleFromFilename(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled";
}

export function UploadTracks({
  userId,
  initial,
  usedBytes,
}: {
  userId: string;
  initial: MyUpload[];
  usedBytes: number;
}) {
  const router = useRouter();
  const player = usePlayer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [client] = useState(() => createClient());

  const [uploads, setUploads] = useState<MyUpload[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const used = uploads.reduce((sum, u) => sum + Number(u.size_bytes), 0) || usedBytes;
  const pct = Math.min(100, (used / UPLOAD_LIMITS.maxTotalBytes) * 100);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("audio/")) {
      setError("That isn't an audio file.");
      return;
    }
    if (file.size > UPLOAD_LIMITS.maxFileBytes) {
      setError(
        `Files need to be under ${prettyBytes(UPLOAD_LIMITS.maxFileBytes)}.`,
      );
      return;
    }

    setBusy(true);
    try {
      const durationMs = await readDuration(file);
      const extension = file.name.split(".").pop() ?? "mp3";
      // Path must start with the owner id — the storage policy enforces it.
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await client.storage
        .from("tracks")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data, error: rowError } = await client
        .from("uploads")
        .insert({
          owner_id: userId,
          storage_path: path,
          title: titleFromFilename(file.name),
          duration_ms: durationMs,
          size_bytes: file.size,
          mime_type: file.type,
        })
        .select("id, title, artist, duration_ms, size_bytes, storage_path")
        .single();

      if (rowError || !data) {
        // The quota trigger rejects here, so the orphaned object is cleaned up.
        await client.storage.from("tracks").remove([path]);
        throw new Error(rowError?.message ?? "Couldn't save that track");
      }

      setUploads((current) => [data as MyUpload, ...current]);
      router.refresh();
    } catch (e) {
      const message = (e as Error).message;
      setError(
        /limit reached/i.test(message)
          ? message
          : "That didn't upload. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(upload: MyUpload) {
    setUploads((current) => current.filter((u) => u.id !== upload.id));
    await client.storage.from("tracks").remove([upload.storage_path]);
    await client.from("uploads").delete().eq("id", upload.id);
    router.refresh();
  }

  const toTrack = (u: MyUpload): Track => ({
    id: `upload:${u.id}`,
    provider: "upload",
    providerTrackId: u.id,
    title: u.title,
    artist: u.artist ?? "Your library",
    artworkUrl: null,
    durationMs: u.duration_ms,
    license: null,
    sourceUrl: null,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-[var(--r-lg)] border border-dashed border-ink-500 p-5 text-center">
        <p className="mb-1 text-[14px] font-bold text-tx-hi">
          Add a track of your own
        </p>
        <p className="mx-auto mb-4 max-w-[38ch] text-[12.5px] leading-relaxed text-tx-mid">
          Only you and the people you&apos;re already connected to can hear it.
          Nothing you upload is searchable or public.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-full bg-[image:var(--together)] px-6 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Choose a file"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {error && (
          <p role="alert" className="mt-3 text-[12.5px] text-danger">
            {error}
          </p>
        )}

        <div className="mx-auto mt-5 max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-600">
            <div
              className="h-full rounded-full bg-[image:var(--together)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11.5px] text-tx-lo">
            {prettyBytes(used)} of {prettyBytes(UPLOAD_LIMITS.maxTotalBytes)} ·{" "}
            {uploads.length}/{UPLOAD_LIMITS.maxFiles} tracks
          </p>
        </div>
      </div>

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-1">
          {uploads.map((upload) => {
            const track = toTrack(upload);
            const active = player.track?.id === track.id;

            return (
              <li
                key={upload.id}
                className="flex items-center gap-3 rounded-[var(--r-md)] p-2 hover:bg-ink-700"
              >
                <button
                  type="button"
                  onClick={() => (active ? player.toggle() : player.play(track))}
                  aria-label={`Play ${upload.title}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[image:var(--together)] text-white"
                >
                  <PlayPauseIcon
                    playing={active && player.isPlaying}
                    loading={active && player.loading}
                    size={14}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-tx-hi">
                    {upload.title}
                  </p>
                  <p className="truncate text-[11.5px] text-tx-lo">
                    {upload.duration_ms > 0
                      ? formatDuration(upload.duration_ms)
                      : "Unknown length"}{" "}
                    · {prettyBytes(Number(upload.size_bytes))}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void remove(upload)}
                  className="shrink-0 px-2 text-[12px] font-semibold text-tx-lo hover:text-danger"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11.5px] leading-relaxed text-tx-lo">
        Only upload music you have the right to share. Anything reported as
        infringing is removed.
      </p>
    </section>
  );
}
