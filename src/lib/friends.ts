import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type FriendProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type Friendship = {
  friendshipId: string;
  status: "pending" | "accepted";
  /** True when the OTHER person sent it — i.e. it is ours to accept. */
  incoming: boolean;
  createdAt: string;
  note: string | null;
  profile: FriendProfile;
};

type Row = {
  id: string;
  user_a: string;
  user_b: string;
  status: "pending" | "accepted";
  requested_by: string;
  note: string | null;
  created_at: string;
};

/**
 * Friendships store a canonical (user_a < user_b) pair rather than a
 * direction, so "the other person" has to be worked out per row. PostgREST
 * cannot express that as a conditional join, hence two queries: the rows,
 * then every counterpart profile in one batch.
 */
export async function getFriendships(
  supabase: SupabaseClient,
  myId: string,
): Promise<Friendship[]> {
  const { data: rows } = await supabase
    .from("friendships")
    .select("id, user_a, user_b, status, requested_by, note, created_at")
    .or(`user_a.eq.${myId},user_b.eq.${myId}`)
    .order("created_at", { ascending: false });

  if (!rows?.length) return [];

  const otherIds = (rows as Row[]).map((r) =>
    r.user_a === myId ? r.user_b : r.user_a,
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", otherIds);

  const byId = new Map<string, FriendProfile>(
    (profiles ?? []).map((p) => [p.id, p as FriendProfile]),
  );

  return (rows as Row[]).flatMap((row) => {
    const otherId = row.user_a === myId ? row.user_b : row.user_a;
    const profile = byId.get(otherId);

    // Readable for any friendship row, pending included (migration 0004).
    // A miss here means the other side was blocked or deleted.
    if (!profile) return [];

    return [
      {
        friendshipId: row.id,
        status: row.status,
        incoming: row.requested_by !== myId,
        createdAt: row.created_at,
        note: row.note,
        profile,
      },
    ];
  });
}

export function displayNameOf(p: FriendProfile) {
  return p.display_name?.trim() || p.username;
}

/**
 * Cached for the render pass. The two-pane desktop layout asks for the same
 * list from both the sidebar and the page, and this collapses that into one
 * round trip.
 */
export const loadFriendships = cache(async (myId: string) => {
  const supabase = await createClient();
  return getFriendships(supabase, myId);
});
