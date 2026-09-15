import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadFriendships } from "@/lib/friends";
import { FriendsList } from "@/components/FriendsList";
import { AddFriendButton } from "@/components/AddFriendButton";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Chrome for every signed-in screen.
 *
 * Desktop gets a persistent rail — brand, profile, conversations, add-friend —
 * so the app reads as an application rather than a phone column stranded in
 * the middle of a monitor. Below lg the rail is hidden and each route is a
 * full screen with its own back affordance, which is the phone model from
 * UX.md §3.
 *
 * The rail lives here rather than in a page so it survives navigation without
 * remounting. That matters in M5, when a music session has to keep playing as
 * you move between conversations.
 */
export default async function AppLayout({
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
    <div className="mx-auto flex w-full max-w-6xl flex-1 lg:gap-0 lg:px-6 lg:py-6">
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
