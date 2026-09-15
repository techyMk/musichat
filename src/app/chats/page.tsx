import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getFriendships, displayNameOf } from "@/lib/friends";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Chats",
  // App routes are never indexable — QUALITY-CHECKLIST.md §0.
  robots: { index: false, follow: false },
};

export default async function ChatsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // No profile row means onboarding was never finished — the row is created
  // when the username is claimed, not at signup (migration 0001).
  if (!profile) redirect("/onboarding/username");

  const friendships = await getFriendships(supabase, user.id);
  const friends = friendships.filter((f) => f.status === "accepted");
  const pending = friendships.filter((f) => f.status === "pending" && f.incoming);

  return (
    <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-5">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/me" aria-label="Your profile">
          <Avatar
            name={profile.display_name || profile.username}
            src={profile.avatar_url}
            size="md"
          />
        </Link>
        <p className="font-display flex-1 text-[21px] font-bold tracking-tight text-tx-hi">
          Musi
          <span className="bg-[image:var(--together)] bg-clip-text text-transparent">
            Chat
          </span>
        </p>
        <Link
          href="/friends/add"
          aria-label="Add a friend"
          className="relative grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-[17px] text-tx-mid hover:text-tx-hi"
        >
          +
          {pending.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-you-500 px-1 text-[9.5px] font-bold text-white">
              {pending.length}
            </span>
          )}
        </Link>
      </header>

      {friends.length === 0 ? (
        <EmptyState hasPending={pending.length > 0} />
      ) : (
        <ul className="flex flex-col">
          {friends.map((f) => (
            <li key={f.friendshipId}>
              <Link
                href={`/chats/${f.friendshipId}`}
                className="flex items-center gap-3 rounded-[var(--r-md)] px-1 py-2.5 transition-colors duration-[var(--dur-fast)] hover:bg-ink-700"
              >
                <Avatar
                  name={displayNameOf(f.profile)}
                  src={f.profile.avatar_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-tx-hi">
                    {displayNameOf(f.profile)}
                  </p>
                  <p className="truncate text-[12.5px] text-tx-mid">
                    Say something — messages arrive in the next milestone
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function EmptyState({ hasPending }: { hasPending: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-display text-[25px] leading-tight font-bold tracking-tight text-tx-hi">
        It&apos;s quiet in here
      </h1>
      <p className="max-w-[32ch] text-[13px] leading-relaxed text-tx-mid">
        {hasPending
          ? "Someone's waiting to connect with you."
          : "This app needs two people. Invite the one you'd send a song to at midnight."}
      </p>
      <div className="mt-3 flex w-full flex-col gap-2.5">
        <ButtonLink href={hasPending ? "/friends/add?tab=requests" : "/friends/add"} full>
          {hasPending ? "See who it is" : "Invite someone"}
        </ButtonLink>
        <ButtonLink href="/friends/add?tab=search" variant="ghost" full>
          Search by username
        </ButtonLink>
      </div>
    </div>
  );
}
