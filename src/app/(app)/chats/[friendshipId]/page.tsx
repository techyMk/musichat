import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { loadFriendships, displayNameOf } from "@/lib/friends";
import { Avatar } from "@/components/ui/Avatar";

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

  // Only friendships we are part of come back at all — RLS decides, not this
  // lookup. A stranger's id simply is not in the list.
  const friendships = await loadFriendships(user.id);
  const friendship = friendships.find((f) => f.friendshipId === friendshipId);

  if (!friendship || friendship.status !== "accepted") notFound();

  const name = displayNameOf(friendship.profile);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-ink-600 px-4 py-3">
        <Link
          href="/chats"
          aria-label="Back to chats"
          className="text-[18px] text-tx-mid hover:text-tx-hi lg:hidden"
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

      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <h2 className="font-display text-[22px] leading-tight font-bold tracking-tight text-tx-hi">
          You&apos;re connected
        </h2>
        <p className="max-w-[36ch] text-[13.5px] leading-relaxed text-tx-mid">
          Messages and the shared player are the next two milestones. When
          they land, this is where you and {name} will listen together.
        </p>
      </div>

      {/* The composer's shape is here so the layout does not shift when it
          becomes real in M3. */}
      <div className="border-t border-ink-600 px-4 py-3">
        <div
          aria-hidden="true"
          className="flex items-center gap-2 rounded-full border border-ink-500 bg-ink-700 px-4 py-2.5 text-[13px] text-tx-lo"
        >
          Messages arrive in the next milestone
        </div>
      </div>
    </div>
  );
}
