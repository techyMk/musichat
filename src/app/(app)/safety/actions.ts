"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

const REASONS = ["spam", "harassment", "sexual", "copyright", "other"] as const;

/**
 * Blocking ends the friendship and any live session in one call (SEC-10).
 * Leaving a session running would keep audio flowing between two people who
 * just stopped being connected.
 */
export async function blockUser(formData: FormData) {
  const target = String(formData.get("target") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.rpc("block_user", { target });

  revalidatePath("/chats");
  revalidatePath("/me/blocked");
  redirect("/chats");
}

export async function unblockUser(formData: FormData) {
  const target = String(formData.get("target") ?? "");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.rpc("unblock_user", { target });

  revalidatePath("/me/blocked");
}

export async function reportUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const target = String(formData.get("target") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "").trim();
  const alsoBlock = formData.get("also_block") === "on";

  if (!(REASONS as readonly string[]).includes(reason)) {
    return { error: "Pick a reason." };
  }

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_user_id: target,
    reason,
    detail: detail || null,
  });

  if (error) {
    return { error: "Couldn't send that report. Try again in a moment." };
  }

  // Reporting and blocking usually arrive together, so the flow offers both
  // rather than making someone do it twice (UX.md §6.9).
  if (alsoBlock) {
    await supabase.rpc("block_user", { target });
    revalidatePath("/chats");
    redirect("/chats");
  }

  return { ok: true };
}

/**
 * Clears everything this account owns, then signs out.
 *
 * The auth row itself needs service-role privileges to remove, which the
 * browser does not have. This deletes the user's own data immediately so the
 * account is functionally gone the moment it is confirmed; the remaining auth
 * record carries nothing but an email and is purged on the 30-day cycle
 * promised in the privacy policy.
 */
export async function deleteAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const confirmation = String(formData.get("confirm") ?? "").trim();
  if (confirmation.toLowerCase() !== "delete") {
    return { error: 'Type "delete" to confirm.' };
  }

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_data");

  if (error) {
    return { error: "Couldn't delete your account. Try again in a moment." };
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/?deleted=1");
}
