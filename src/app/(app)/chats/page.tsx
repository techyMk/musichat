import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadFriendships } from "@/lib/friends";
import { FriendsList, FriendsEmptyState } from "@/components/FriendsList";
import { AddFriendButton } from "@/components/AddFriendButton";
import { Avatar } from "@/components/ui/Avatar";

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

  if (!profile) redirect("/onboarding/username");

  const friendships = await loadFriendships(user.id);
  const friends = friendships.filter((f) => f.status === "accepted");
  const pending = friendships.filter((f) => f.status === "pending" && f.incoming);

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      {/* Phone: this route IS the list, with its own header. Desktop already
          has the rail, so the header would be a duplicate. */}
      <header className="flex items-center gap-3 px-4 py-4 lg:hidden">
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
        <AddFriendButton count={pending.length} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-5 lg:hidden">
        {friends.length > 0 ? (
          <FriendsList friends={friends} />
        ) : (
          <FriendsEmptyState hasPending={pending.length > 0} />
        )}
      </div>

      {/* Desktop: the rail lists conversations, so this pane invites a pick. */}
      <div className="hidden flex-1 flex-col lg:flex">
        {friends.length > 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <h2 className="font-display text-[22px] font-bold tracking-tight text-tx-hi">
              Pick someone to vibe with
            </h2>
            <p className="max-w-[36ch] text-[13.5px] leading-relaxed text-tx-mid">
              Choose a conversation on the left, or invite someone new.
            </p>
          </div>
        ) : (
          <FriendsEmptyState hasPending={pending.length > 0} />
        )}
      </div>
    </div>
  );
}
