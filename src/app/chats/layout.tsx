import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadFriendships } from "@/lib/friends";
import { FriendsList } from "@/components/FriendsList";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Desktop gets a two-pane layout: a persistent conversation rail and the open
 * conversation beside it. Below lg the rail is hidden and each route is a full
 * screen of its own, which is the phone behaviour from UX.md §3.
 *
 * The rail lives in the layout so it does not remount when you switch
 * conversations — that matters later, when a music session has to survive
 * navigation.
 */
export default async function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 lg:px-6 lg:py-6">
      <aside className="hidden w-[330px] shrink-0 flex-col lg:flex lg:rounded-l-[var(--r-xl)] lg:border lg:border-ink-600 lg:bg-ink-900/40">
        <header className="flex items-center gap-3 px-4 py-4">
          <Link href="/me" aria-label="Your profile">
            <Avatar
              name={profile.display_name || profile.username}
              src={profile.avatar_url}
              size="md"
            />
          </Link>
          <p className="font-display flex-1 text-[20px] font-bold tracking-tight text-tx-hi">
            Musi
            <span className="bg-[image:var(--together)] bg-clip-text text-transparent">
              Chat
            </span>
          </p>
          <AddFriendButton count={pending.length} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {friends.length > 0 ? (
            <FriendsList friends={friends} />
          ) : (
            <p className="px-3 py-6 text-[13px] leading-relaxed text-tx-lo">
              No one here yet. Share your invite code and this fills up.
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:rounded-r-[var(--r-xl)] lg:border lg:border-l-0 lg:border-ink-600">
        {children}
      </div>
    </div>
  );
}

export function AddFriendButton({ count }: { count: number }) {
  return (
    <Link
      href="/friends/add"
      aria-label="Add a friend"
      className="relative grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-[17px] text-tx-mid transition-colors duration-[var(--dur-fast)] hover:text-tx-hi"
    >
      +
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-you-500 px-1 text-[9.5px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
