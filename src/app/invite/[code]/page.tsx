import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { peekInvite, inviterName } from "@/lib/invite";
import { redeemInvite } from "@/app/invite/actions";
import { absoluteUrl } from "@/lib/site";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmbeddedBrowserNotice } from "@/components/EmbeddedBrowserNotice";

const PITCH = "Chat and hear the same song at the same moment, wherever you both are.";

/**
 * Per-invite metadata. This is the reason the app is server rendered at all:
 * WhatsApp, Instagram and iMessage preview bots read the raw HTML and never
 * run JavaScript, so a client-rendered page would show the same generic card
 * for every invite in the world — or no card whatsoever.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const invite = await peekInvite(code);

  if (!invite) {
    return { title: "Invite not found", robots: { index: false } };
  }

  const name = inviterName(invite);
  const title = `${name} wants to vibe with you`;
  const image = absoluteUrl(`/og/invite/${code}`);

  return {
    title,
    description: PITCH,
    // Personal links, not marketing pages. Previews still work — those do not
    // depend on indexing.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title,
      description: PITCH,
      url: absoluteUrl(`/invite/${code}`),
      siteName: "MusiChat",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: PITCH,
      images: [image],
    },
  };
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const { error } = await searchParams;

  const invite = await peekInvite(code);
  const user = await getUser();

  if (!invite) return <InviteNotFound />;

  const name = inviterName(invite);
  const isSelf = user?.id === invite.inviter_id;

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10 sm:py-14"
    >
      <div className="sm:rounded-[var(--r-xl)] sm:border sm:border-ink-600 sm:bg-ink-900/40 sm:p-8">
        <EmbeddedBrowserNotice />

        <div className="flex flex-col items-center text-center">
          <Avatar
            name={name}
            src={invite.avatar_url}
            size="xxl"
            vibing
            className="mb-6"
          />

          <h1 className="font-display mb-2.5 text-[27px] leading-tight font-bold tracking-tight text-balance text-tx-hi">
            {name} wants to vibe with you
          </h1>

          <p className="mb-7 max-w-[34ch] text-[13.5px] leading-relaxed text-balance text-tx-mid">
            {PITCH}
          </p>

          {error && (
            <p
              role="alert"
              className="mb-4 w-full rounded-[var(--r-sm)] border border-[rgba(249,69,69,0.3)] bg-[rgba(249,69,69,0.1)] px-3 py-2 text-[12.5px] font-semibold text-danger"
            >
              That didn&apos;t connect. The code may have been turned off.
            </p>
          )}

          <div className="flex w-full flex-col gap-2.5">
            {isSelf ? (
              <>
                <p className="text-[13px] text-tx-mid">
                  This is your own invite link. Send it to someone else.
                </p>
                <ButtonLink href="/friends/add" variant="ghost" full>
                  Back to your invite
                </ButtonLink>
              </>
            ) : user ? (
              <form action={redeemInvite}>
                <input type="hidden" name="code" value={code} />
                <Button type="submit" full>
                  Connect with {name}
                </Button>
              </form>
            ) : (
              <>
                <ButtonLink
                  href={`/signup?invite=${encodeURIComponent(code)}`}
                  full
                >
                  Join {name}
                </ButtonLink>
                <p className="text-[13px] text-tx-lo">
                  Already have an account?{" "}
                  <Link
                    href={`/login?next=${encodeURIComponent(`/invite/${code}`)}`}
                    className="font-bold text-you-500 hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </>
            )}
          </div>

          <p className="mt-5 text-[12px] text-tx-lo">
            Free. No subscription, on either side.
          </p>
        </div>
      </div>
    </main>
  );
}

function InviteNotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-14 text-center"
    >
      <h1 className="font-display mb-3 text-[27px] leading-tight font-bold tracking-tight text-tx-hi">
        This invite isn&apos;t active
      </h1>
      <p className="mb-8 text-[14px] leading-relaxed text-tx-mid">
        The code may have been turned off, or the link might be mistyped. Ask
        for a fresh one.
      </p>
      <ButtonLink href="/" full>
        See what MusiChat is
      </ButtonLink>
    </main>
  );
}
