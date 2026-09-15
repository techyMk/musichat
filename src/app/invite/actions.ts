"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

/**
 * Connects the signed-in user to whoever issued the code.
 *
 * Deliberately a server action rather than something that fires on page load:
 * joining is a side effect, and a GET that mutates would trigger on link
 * prefetch and crawler visits.
 */
export async function redeemInvite(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();

  const user = await getUser();
  if (!user) redirect(`/signup?invite=${encodeURIComponent(code)}`);

  const supabase = await createClient();

  // No profile means onboarding is unfinished. Claim a username first, and
  // carry the code so it is redeemed on the other side (UX.md §6.2 — invited
  // users go straight into the conversation, skipping profile setup).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect(`/onboarding/username?invite=${encodeURIComponent(code)}`);
  }

  const { data: friendshipId, error } = await supabase.rpc("redeem_invite", {
    invite_code: code,
  });

  if (error || !friendshipId) redirect("/invite/" + code + "?error=1");

  revalidatePath("/chats");
  redirect(`/chats/${friendshipId}`);
}
