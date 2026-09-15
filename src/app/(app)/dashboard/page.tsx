import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadFriendships, displayNameOf } from "@/lib/friends";
import { absoluteUrl } from "@/lib/site";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { InviteActions } from "@/app/(app)/friends/add/InviteActions";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/username");

  const friendships = await loadFriendships(user.id);
  const friends = friendships.filter((f) => f.status === "accepted");
  const pending = friendships.filter((f) => f.status === "pending" && f.incoming);

  const { data: code } = await supabase.rpc("get_or_create_invite");
  const link = absoluteUrl(`/invite/${code}`);

  const firstName = (profile.display_name || profile.username).split(" ")[0];

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Dashboard" />

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-6">
        <h2 className="font-display mb-1 text-[26px] leading-tight font-bold tracking-tight text-tx-hi">
          Hello, {firstName}
        </h2>
        <p className="mb-7 text-[13.5px] leading-relaxed text-tx-mid">
          {friends.length === 0
            ? "Nobody's connected yet. Your invite code is below — that's the whole setup."
            : friends.length === 1
              ? "One person to vibe with. That's really all this app needs."
              : `${friends.length} people to vibe with.`}
        </p>

        {pending.length > 0 && (
          <Link
            href="/friends/add?tab=requests"
            className="mb-6 flex items-center gap-3 rounded-[var(--r-md)] border border-you-500/40 bg-[rgba(255,79,151,0.1)] px-4 py-3 transition-colors duration-[var(--dur-fast)] hover:bg-[rgba(255,79,151,0.16)]"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-you-500 text-[12px] font-bold text-white">
              {pending.length}
            </span>
            <span className="flex-1 text-[13.5px] font-semibold text-tx-hi">
              {pending.length === 1
                ? "Someone wants to connect with you"
                : `${pending.length} people want to connect with you`}
            </span>
            <span aria-hidden="true" className="text-tx-mid">
              ›
            </span>
          </Link>
        )}

        <section className="mb-8">
          <h3 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Your people
          </h3>

          {friends.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {friends.slice(0, 6).map((f) => (
                <li key={f.friendshipId}>
                  <Link
                    href={`/chats/${f.friendshipId}`}
                    className="flex items-center gap-3 rounded-[var(--r-md)] border border-ink-600 bg-ink-800/60 px-3.5 py-3 transition-colors duration-[var(--dur-fast)] hover:bg-ink-700"
                  >
                    <Avatar
                      name={displayNameOf(f.profile)}
                      src={f.profile.avatar_url}
                      size="md"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-tx-hi">
                        {displayNameOf(f.profile)}
                      </span>
                      <span className="block truncate text-[11.5px] text-tx-lo">
                        @{f.profile.username}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[var(--r-md)] border border-dashed border-ink-500 px-4 py-6 text-center">
              <p className="mb-3 text-[13px] leading-relaxed text-tx-mid">
                MusiChat needs two people. Send your code to one.
              </p>
              <ButtonLink href="/friends/add?tab=search" variant="ghost">
                Search by username
              </ButtonLink>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-[var(--r-lg)] border border-ink-600 bg-ink-800/60 p-5">
          <h3 className="mb-1 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Your invite code
          </h3>
          <p className="font-display mb-4 text-[26px] font-bold tracking-[0.08em] text-tx-hi">
            {code}
          </p>
          <InviteActions link={link} code={code as string} />
        </section>

        <section>
          <h3 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Listening together
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Sessions", value: "—" },
              { label: "Songs", value: "—" },
              { label: "Hours", value: "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--r-md)] border border-ink-600 bg-ink-800/40 px-3 py-4 text-center"
              >
                <p className="font-display text-[22px] font-bold text-tx-hi tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11px] text-tx-lo">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-tx-lo">
            These fill in once the shared player ships.
          </p>
        </section>
      </div>
    </div>
  );
}
