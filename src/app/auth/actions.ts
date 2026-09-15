"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";
import { safeNext } from "@/lib/safe-next";

export type FormState = { error?: string };

const MIN_PASSWORD = 8;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

/**
 * Errors explain what went wrong and what to do about it, and never apologise
 * (DESIGN.md §9). Supabase's raw strings are developer-facing.
 */
function humanize(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "That email already has an account. Try logging in instead.";
  if (m.includes("invalid login")) return "That email and password don't match.";
  if (m.includes("email not confirmed"))
    return "Confirm your email first — check your inbox for the link.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a minute and try again.";
  if (m.includes("password")) return `Passwords need at least ${MIN_PASSWORD} characters.`;
  return "Something went wrong on our side. Try again in a moment.";
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { email, password } = readCredentials(formData);

  if (!email.includes("@")) return { error: "That doesn't look like an email address." };
  if (password.length < MIN_PASSWORD)
    return { error: `Passwords need at least ${MIN_PASSWORD} characters.` };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Straight into onboarding once the email is confirmed.
      emailRedirectTo: absoluteUrl("/auth/callback?next=/onboarding/username"),
    },
  });

  if (error) return { error: humanize(error.message) };

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { email, password } = readCredentials(formData);
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately identical whether the email exists or the password is wrong,
  // so this cannot be used to discover who has an account.
  if (error) return { error: humanize(error.message) };

  redirect(next);
}

export async function resendConfirmation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "No email address to send to." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: absoluteUrl("/auth/callback?next=/onboarding/username"),
    },
  });

  if (error) return { error: humanize(error.message) };
  return { error: undefined };
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
    },
  });

  if (error || !data?.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email.includes("@")) return { error: "That doesn't look like an email address." };

  const supabase = await createClient();
  // The result is ignored on purpose. Reporting whether the address exists
  // would turn this form into a way of discovering who has an account.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl("/auth/callback?next=/reset"),
  });

  redirect(`/forgot?sent=${encodeURIComponent(email)}`);
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD)
    return { error: `Passwords need at least ${MIN_PASSWORD} characters.` };
  if (password !== confirm) return { error: "Those two passwords don't match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Arriving here without a session means the recovery link expired or was
  // already used.
  if (!user) redirect("/login?error=link");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: humanize(error.message) };

  // Everything else gets logged out — if someone else knew the old password,
  // this is the moment that stops mattering.
  await supabase.auth.signOut({ scope: "others" });

  redirect("/chats");
}

export async function signOut(formData?: FormData) {
  const everywhere = formData?.get("scope") === "global";
  const supabase = await createClient();
  await supabase.auth.signOut(everywhere ? { scope: "global" } : undefined);
  redirect("/login");
}
