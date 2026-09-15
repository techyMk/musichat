"use server";

import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import type { FormState } from "@/app/auth/actions";
import {
  USERNAME_PATTERN,
  GENRES,
  MAX_GENRES,
  BIO_LIMIT,
  DISPLAY_NAME_LIMIT,
} from "./constants";

export async function claimUsername(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "Usernames are 3–20 characters, using letters, numbers and underscores.",
    };
  }

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, username });

  if (error) {
    // 23505 is Postgres' unique violation. The live check should have caught
    // this, but two people can claim the same name in the same second — the
    // database is the only place that can actually decide.
    if (error.code === "23505") {
      return { error: `@${username} was just taken. Try another.` };
    }
    return { error: "Couldn't save that username. Try again in a moment." };
  }

  redirect("/onboarding/profile");
}

export async function saveProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const genres = formData
    .getAll("genres")
    .map(String)
    .filter((g) => (GENRES as readonly string[]).includes(g))
    .slice(0, MAX_GENRES);

  if (displayName.length > DISPLAY_NAME_LIMIT) {
    return { error: `Display names can be up to ${DISPLAY_NAME_LIMIT} characters.` };
  }
  if (bio.length > BIO_LIMIT) {
    return { error: `Bios can be up to ${BIO_LIMIT} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      genres,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Couldn't save your profile. Try again in a moment." };
  }

  redirect("/chats");
}
