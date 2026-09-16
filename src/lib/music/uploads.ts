import type { SupabaseClient } from "@supabase/supabase-js";
import type { Track } from "./types";
import { trackKey } from "./types";

/**
 * The user's own tracks, as a music source.
 *
 * Unlike Audius and the Internet Archive this cannot be a stateless provider:
 * every query depends on who is asking, and the bucket is private. So it takes
 * an authenticated client rather than implementing MusicProvider.
 */

export const UPLOAD_LIMITS = {
  maxFiles: 25,
  maxTotalBytes: 200 * 1024 * 1024,
  maxFileBytes: 20 * 1024 * 1024,
  /** Signed URLs live just long enough for a long track plus seeking. */
  signedUrlSeconds: 60 * 60 * 2,
};

type UploadRow = {
  id: string;
  owner_id: string;
  storage_path: string;
  title: string;
  artist: string | null;
  duration_ms: number;
};

function toTrack(row: UploadRow, ownerLabel: string): Track {
  return {
    id: trackKey("upload", row.id),
    provider: "upload",
    providerTrackId: row.id,
    title: row.title,
    artist: row.artist?.trim() || ownerLabel,
    artworkUrl: null,
    durationMs: row.duration_ms,
    license: "Uploaded by a listener",
    sourceUrl: null,
  };
}

/** Your own tracks, plus any belonging to people you're already friends with. */
export async function searchUploads(
  supabase: SupabaseClient,
  query: string,
  limit = 10,
): Promise<Track[]> {
  let request = supabase
    .from("uploads")
    .select("id, owner_id, storage_path, title, artist, duration_ms")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query.trim()) {
    const q = query.trim().replace(/[%_]/g, "");
    request = request.or(`title.ilike.%${q}%,artist.ilike.%${q}%`);
  }

  const { data } = await request;
  return ((data ?? []) as UploadRow[]).map((row) => toTrack(row, "Your library"));
}

export async function listMyUploads(supabase: SupabaseClient, ownerId: string) {
  const { data } = await supabase
    .from("uploads")
    .select("id, owner_id, storage_path, title, artist, duration_ms, size_bytes, created_at")
    .eq("owner_id", ownerId)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Signs a playable URL. The bucket is private, so a path alone is worthless —
 * and the signature expires, so a shared URL does not become permanent access.
 */
export async function signUploadUrl(
  supabase: SupabaseClient,
  uploadId: string,
): Promise<string | null> {
  // RLS decides visibility: a row you may not read simply is not returned.
  const { data: row } = await supabase
    .from("uploads")
    .select("storage_path")
    .eq("id", uploadId)
    .is("removed_at", null)
    .maybeSingle();

  if (!row) return null;

  const { data } = await supabase.storage
    .from("tracks")
    .createSignedUrl(row.storage_path, UPLOAD_LIMITS.signedUrlSeconds);

  return data?.signedUrl ?? null;
}
