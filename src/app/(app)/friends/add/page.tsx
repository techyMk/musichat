import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getFriendships, displayNameOf } from "@/lib/friends";
import { absoluteUrl } from "@/lib/site";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/cn";
import { SearchPanel } from "./SearchPanel";
import { InviteActions } from "./InviteActions";
import { acceptFriendRequest, declineFriendRequest } from "@/app/friends/actions";

export const metadata: Metadata = {
  title: "Add a friend",
  robots: { index: false, follow: false },
};

type Tab = "invite" | "search" | "requests";
const TABS: { id: Tab; label: string }[] = [
  { id: "invite", label: "Invite" },
  { id: "search", label: "Search" },
  { id: "requests", label: "Requests" },
];

export default async function AddFriendPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const tab: Tab = TABS.some((t) => t.id === params.tab)
    ? (params.tab as Tab)
    : "invite";

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const friendships = await getFriendships(supabase, user.id);
  const incoming = friendships.filter((f) => f.status === "pending" && f.incoming);
  const outgoing = friendships.filter((f) => f.status === "pending" && !f.incoming);

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Add a friend" />

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 py-6">
      <nav className="mb-6 flex rounded-full bg-ink-700 p-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/friends/add?tab=${t.id}`}
            className={cn(
              "flex-1 rounded-full py-2 text-center text-[12px] font-bold transition-colors duration-[var(--dur-fast)]",
              tab === t.id ? "bg-ink-500 text-tx-hi" : "text-tx-mid hover:text-tx-hi",
            )}
          >
            {t.label}
            {t.id === "requests" && incoming.length > 0 && (
              <span className="ml-1.5 inline-grid h-4 min-w-4 place-items-center rounded-full bg-you-500 px-1 text-[9.5px] text-white">
                {incoming.length}
              </span>
            )}
          </Link>
        ))}
      </nav>

        {tab === "invite" && <InviteTab />}
        {tab === "search" && <SearchPanel />}
        {tab === "requests" && (
          <RequestsTab
            incoming={incoming}
            outgoing={outgoing}
            justSent={!!params.sent}
          />
        )}
      </div>
    </div>
  );
}

async function InviteTab() {
  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("get_or_create_invite");

  // Never render a link built from a null code. Silently interpolating the
  // failure produced /invite/null, which looked like a working link and was
  // not — the error has to be visible.
  if (error || !code) {
    return (
      <section className="rounded-[var(--r-md)] border border-[rgba(249,69,69,0.3)] bg-[rgba(249,69,69,0.08)] p-5 text-center">
        <h2 className="mb-1.5 text-[15px] font-bold text-tx-hi">
          Couldn&apos;t create your invite code
        </h2>
        <p className="text-[13px] leading-relaxed text-tx-mid">
          Reload the page to try again. If it keeps happening, the database
          migration for invite codes may not have run yet.
        </p>
      </section>
    );
  }

  const link = absoluteUrl(`/invite/${code}`);

  // Rendered on the server so no QR library reaches the browser bundle.
  const qr = await QRCode.toString(link, {
    type: "svg",
    margin: 1,
    color: { dark: "#141128", light: "#F2EFFB" },
  });

  return (
    <section className="text-center">
      <h2 className="font-display mb-1.5 text-[21px] font-bold tracking-tight text-tx-hi">
        Come vibe with me
      </h2>
      <p className="mx-auto mb-6 max-w-[32ch] text-[13px] leading-relaxed text-tx-mid">
        Send this to one person. They&apos;ll land straight in a chat with you,
        already connected.
      </p>

      <div
        className="mx-auto mb-5 w-[160px] overflow-hidden rounded-[var(--r-md)] bg-[#F2EFFB] p-2.5"
        dangerouslySetInnerHTML={{ __html: qr }}
      />

      <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
        Your code
      </p>
      <p className="font-display mb-5 text-[26px] font-bold tracking-[0.08em] text-tx-hi">
        {code}
      </p>

      <InviteActions link={link} code={code as string} />
    </section>
  );
}

function RequestsTab({
  incoming,
  outgoing,
  justSent,
}: {
  incoming: Awaited<ReturnType<typeof getFriendships>>;
  outgoing: Awaited<ReturnType<typeof getFriendships>>;
  justSent: boolean;
}) {
  if (!incoming.length && !outgoing.length) {
    return (
      <p className="py-10 text-center text-[13px] leading-relaxed text-tx-mid">
        {justSent
          ? "Request sent. They'll see it next time they open the app."
          : "No requests waiting. Share your invite code to get started."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Wants to connect
          </h2>
          <ul className="flex flex-col gap-3">
            {incoming.map((f) => (
              <li key={f.friendshipId} className="flex items-center gap-3">
                <Avatar
                  name={displayNameOf(f.profile)}
                  src={f.profile.avatar_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-tx-hi">
                    {displayNameOf(f.profile)}
                  </p>
                  <p className="truncate text-[12px] text-tx-lo">
                    {f.note || `@${f.profile.username}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <form action={declineFriendRequest}>
                    <input type="hidden" name="friendship_id" value={f.friendshipId} />
                    <Button variant="skip" type="submit" className="px-3 py-2 text-[12px]">
                      Ignore
                    </Button>
                  </form>
                  <form action={acceptFriendRequest}>
                    <input type="hidden" name="friendship_id" value={f.friendshipId} />
                    <Button type="submit" className="px-4 py-2 text-[12px]">
                      Accept
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Waiting on them
          </h2>
          <ul className="flex flex-col gap-3">
            {outgoing.map((f) => (
              <li key={f.friendshipId} className="flex items-center gap-3">
                <Avatar
                  name={displayNameOf(f.profile)}
                  src={f.profile.avatar_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-tx-hi">
                    {displayNameOf(f.profile)}
                  </p>
                  <p className="text-[12px] text-tx-lo">Request sent</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
