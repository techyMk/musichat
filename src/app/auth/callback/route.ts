import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";
import { safeNext } from "@/lib/safe-next";

/**
 * Where email confirmation links and OAuth redirects land.
 *
 * Redirect targets are built from our own base URL rather than the request's
 * origin — behind Vercel's proxy the request origin can be an internal
 * hostname, which would send users somewhere that does not resolve.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(absoluteUrl(next));
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "email_change" | "recovery" | "invite",
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(absoluteUrl(next));
  }

  return NextResponse.redirect(absoluteUrl("/login?error=link"));
}
