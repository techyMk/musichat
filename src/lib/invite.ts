import { createClient } from "@/lib/supabase/server";

export type InvitePeek = {
  inviter_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

/**
 * Looks up who is behind an invite code.
 *
 * peek_invite is the one function granted to anon, because this page has to
 * render for someone who has never signed in — and has to render on the
 * server, because WhatsApp's preview bot does not run JavaScript.
 */
export async function peekInvite(code: string): Promise<InvitePeek | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("peek_invite", {
    invite_code: code,
  });

  if (error) return null;
  return (data as InvitePeek[])?.[0] ?? null;
}

export function inviterName(invite: InvitePeek) {
  return invite.display_name?.trim() || invite.username;
}
