"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import type { FriendProfile } from "@/lib/friends";

export type SearchState = {
  query?: string;
  found?: FriendProfile | null;
  error?: string;
};

/**
 * Exact username only — find_profile_by_username does not do prefixes, so the
 * user table cannot be walked a letter at a time.
 */
export async function searchByUsername(
  _prev: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const query = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!query) return { error: "Enter a username to look for." };

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_profile_by_username", {
    candidate: query,
  });

  if (error) return { query, error: "Search didn't work. Try again." };

  const found = (data as FriendProfile[])?.[0] ?? null;
  return { query, found };
}

export async function sendFriendRequest(formData: FormData) {
  const target = String(formData.get("target") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.rpc("request_friendship", {
    target,
    message: note || null,
  });

  revalidatePath("/friends/add");
  redirect("/friends/add?tab=requests&sent=1");
}

export async function acceptFriendRequest(formData: FormData) {
  const id = String(formData.get("friendship_id") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  // The "accept incoming friendships" policy rejects this if we are the
  // sender, so nobody can accept their own request.
  await supabase
    .from("friendships")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/friends/add");
  revalidatePath("/chats");
  redirect("/chats");
}

/** Declining is silent — the sender is never told (UX.md §6.3). */
export async function declineFriendRequest(formData: FormData) {
  const id = String(formData.get("friendship_id") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("id", id);

  revalidatePath("/friends/add");
}

export async function removeFriend(formData: FormData) {
  const id = String(formData.get("friendship_id") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("id", id);

  revalidatePath("/chats");
  redirect("/chats");
}
