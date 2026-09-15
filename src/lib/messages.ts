import type { SupabaseClient } from "@supabase/supabase-js";

export type MessageKind = "text" | "system" | "track";

export type TrackRef = {
  id: string;
  provider: string;
  providerTrackId: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationMs: number;
};

export type Message = {
  id: string;
  friendshipId: string;
  senderId: string;
  kind: MessageKind;
  body: string | null;
  trackRef: TrackRef | null;
  createdAt: string;
  deletedAt: string | null;
};

type Row = {
  id: string;
  friendship_id: string;
  sender_id: string;
  kind: MessageKind;
  body: string | null;
  track_ref: TrackRef | null;
  created_at: string;
  deleted_at: string | null;
};

export function toMessage(row: Row): Message {
  return {
    id: row.id,
    friendshipId: row.friendship_id,
    senderId: row.sender_id,
    kind: row.kind,
    body: row.body,
    trackRef: row.track_ref,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

export const PAGE_SIZE = 40;

/** Newest page first from the database, returned oldest-first for rendering. */
export async function loadMessages(
  supabase: SupabaseClient,
  friendshipId: string,
  limit = PAGE_SIZE,
): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("id, friendship_id, sender_id, kind, body, track_ref, created_at, deleted_at")
    .eq("friendship_id", friendshipId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as Row[]).map(toMessage).reverse();
}

/** Messages within this window from the same sender are visually grouped. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function shouldGroup(previous: Message | undefined, current: Message) {
  if (!previous) return false;
  if (previous.senderId !== current.senderId) return false;
  if (previous.kind !== "text" || current.kind !== "text") return false;
  return (
    new Date(current.createdAt).getTime() -
      new Date(previous.createdAt).getTime() <
    GROUP_WINDOW_MS
  );
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}
