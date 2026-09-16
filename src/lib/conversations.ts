import type { SupabaseClient } from "@supabase/supabase-js";

export type ConversationSummary = {
  friendshipId: string;
  partnerId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  lastBody: string | null;
  lastKind: string | null;
  lastSenderId: string | null;
  lastAt: string | null;
  unreadCount: number;
  isVibing: boolean;
  vibingTrack: string | null;
};

type Row = {
  friendship_id: string;
  partner_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  last_body: string | null;
  last_kind: string | null;
  last_sender_id: string | null;
  last_at: string | null;
  unread_count: number;
  is_vibing: boolean;
  vibing_track: string | null;
};

export async function loadConversations(
  supabase: SupabaseClient,
): Promise<ConversationSummary[]> {
  const { data } = await supabase.rpc("conversation_summaries");

  return ((data ?? []) as Row[]).map((r) => ({
    friendshipId: r.friendship_id,
    partnerId: r.partner_id,
    username: r.username,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    lastBody: r.last_body,
    lastKind: r.last_kind,
    lastSenderId: r.last_sender_id,
    lastAt: r.last_at,
    unreadCount: Number(r.unread_count ?? 0),
    isVibing: Boolean(r.is_vibing),
    vibingTrack: r.vibing_track,
  }));
}

export function conversationName(c: ConversationSummary) {
  return c.displayName?.trim() || c.username;
}

/** Relative and short — a chat list is scanned, not read. */
export function shortTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const day = 86_400_000;

  if (diffMs < day && now.getDate() === then.getDate()) {
    return then.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) return then.toLocaleDateString([], { weekday: "short" });
  return then.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function previewOf(c: ConversationSummary, meId: string): string {
  if (c.isVibing) return `Vibing · ${c.vibingTrack ?? "listening together"}`;
  if (!c.lastBody && !c.lastKind) return "Say something";

  const mine = c.lastSenderId === meId;
  if (c.lastKind === "track") return `${mine ? "You sent" : "Sent"} ♪ ${c.lastBody}`;
  if (!c.lastBody) return "Message deleted";
  return mine ? `You: ${c.lastBody}` : c.lastBody;
}
