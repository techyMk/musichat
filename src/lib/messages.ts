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
  replyToId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

type Row = {
  id: string;
  friendship_id: string;
  sender_id: string;
  kind: MessageKind;
  body: string | null;
  track_ref: TrackRef | null;
  reply_to_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export const MESSAGE_COLUMNS =
  "id, friendship_id, sender_id, kind, body, track_ref, reply_to_id, created_at, edited_at, deleted_at";

export function toMessage(row: Row): Message {
  return {
    id: row.id,
    friendshipId: row.friendship_id,
    senderId: row.sender_id,
    kind: row.kind,
    body: row.body,
    trackRef: row.track_ref,
    replyToId: row.reply_to_id,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
  };
}

export type Watermark = {
  userId: string;
  lastDeliveredAt: string;
  lastReadAt: string;
};

export type ReceiptState = "sending" | "sent" | "delivered" | "read";

/**
 * A watermark rather than a per-message receipt: the partner's timestamps move
 * forward, and every message older than them carries that state.
 */
export function receiptFor(
  message: Message,
  partner: Watermark | null,
): ReceiptState {
  if (message.id.startsWith("pending-")) return "sending";
  if (!partner) return "sent";

  const at = new Date(message.createdAt).getTime();
  if (new Date(partner.lastReadAt).getTime() >= at) return "read";
  if (new Date(partner.lastDeliveredAt).getTime() >= at) return "delivered";
  return "sent";
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
    .select(MESSAGE_COLUMNS)
    .eq("friendship_id", friendshipId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as Row[]).map(toMessage).reverse();
}

/** The other participant's delivered/read watermark for this conversation. */
export async function loadPartnerWatermark(
  supabase: SupabaseClient,
  friendshipId: string,
  meId: string,
): Promise<Watermark | null> {
  const { data } = await supabase
    .from("friendship_reads")
    .select("user_id, last_delivered_at, last_read_at")
    .eq("friendship_id", friendshipId)
    .neq("user_id", meId)
    .maybeSingle();

  if (!data) return null;
  return {
    userId: data.user_id,
    lastDeliveredAt: data.last_delivered_at,
    lastReadAt: data.last_read_at,
  };
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
