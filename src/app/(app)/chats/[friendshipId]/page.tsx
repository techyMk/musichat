import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadFriendships, displayNameOf } from "@/lib/friends";
import { loadMessages } from "@/lib/messages";
import { Avatar } from "@/components/ui/Avatar";
import { MessageThread } from "@/components/chat/MessageThread";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ friendshipId: string }>;
}) {
  const { friendshipId } = await params;

  const user = await getUser();
  if (!user) redirect("/login");

  // Only friendships we belong to come back at all — RLS decides, not this
  // lookup. A stranger's id is simply absent from the list.
  const friendships = await loadFriendships(user.id);
  const friendship = friendships.find((f) => f.friendshipId === friendshipId);

  if (!friendship || friendship.status !== "accepted") notFound();

  const supabase = await createClient();
  const messages = await loadMessages(supabase, friendshipId);
  const name = displayNameOf(friendship.profile);

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-ink-600 px-4 py-3">
        <Link
          href="/chats"
          aria-label="Back to chats"
          className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[18px] text-tx-mid hover:bg-ink-700 hover:text-tx-hi lg:hidden"
        >
          ‹
        </Link>
        <Avatar name={name} src={friendship.profile.avatar_url} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-bold text-tx-hi">{name}</p>
          <p className="truncate text-[11.5px] text-tx-lo">
            @{friendship.profile.username}
          </p>
        </div>
      </header>

      <MessageThread
        friendshipId={friendshipId}
        meId={user.id}
        partnerName={name}
        initialMessages={messages}
      />

      {/* The mini player docks over the bottom edge when something is playing. */}
      <div aria-hidden="true" className="h-16 shrink-0" />
    </div>
  );
}
