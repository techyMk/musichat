import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadFriendships } from "@/lib/friends";
import { loadConversations } from "@/lib/conversations";
import { ConversationList } from "@/components/ConversationList";
import { FriendsEmptyState } from "@/components/FriendsList";
import { AddFriendButton } from "@/components/AddFriendButton";
import { MobileMenu } from "@/components/MobileMenu";
import { Wordmark } from "@/components/Wordmark";

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

  const [friendships, conversations] = await Promise.all([
    loadFriendships(user.id),
    loadConversations(supabase),
  ]);
  const friends = friendships.filter((f) => f.status === "accepted");
  const pending = friendships.filter((f) => f.status === "pending" && f.incoming);

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      {/* Phone: this route IS the list, with its own header. Desktop already
          has the rail, so the header would be a duplicate. */}
      <header className="flex items-center gap-3 px-4 py-4 lg:hidden">
        <MobileMenu
          name={profile.display_name || profile.username}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          pendingCount={pending.length}
        />
        <Wordmark href="/dashboard" size="sm" className="flex-1" />
        <AddFriendButton count={pending.length} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-24 lg:hidden">
        {conversations.length > 0 ? (
          <ConversationList conversations={conversations} meId={user.id} />
        ) : (
          <FriendsEmptyState hasPending={pending.length > 0} />
        )}
      </div>

      {/* Desktop: the rail lists conversations, so this pane invites a pick. */}
      <div className="hidden flex-1 flex-col lg:flex">
        {friends.length > 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div
              aria-hidden="true"
              className="mb-1 h-1 w-14 rounded-full bg-[image:var(--together)] opacity-70"
            />
            <h2 className="font-display text-[23px] font-bold tracking-tight text-tx-hi">
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
