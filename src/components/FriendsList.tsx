import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { displayNameOf, type Friendship } from "@/lib/friends";
import { cn } from "@/lib/cn";

export function FriendsList({
  friends,
  activeId,
}: {
  friends: Friendship[];
  /** Highlights the open conversation in the desktop sidebar. */
  activeId?: string;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {friends.map((f) => {
        const active = f.friendshipId === activeId;
        return (
          <li key={f.friendshipId}>
            <Link
              href={`/chats/${f.friendshipId}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--r-md)] px-2.5 py-2.5",
                "transition-colors duration-[var(--dur-fast)]",
                active ? "bg-ink-700" : "hover:bg-ink-700",
              )}
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
                  @{f.profile.username}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function FriendsEmptyState({ hasPending }: { hasPending: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <h2 className="font-display text-[25px] leading-tight font-bold tracking-tight text-tx-hi">
        It&apos;s quiet in here
      </h2>
      <p className="max-w-[34ch] text-[13.5px] leading-relaxed text-tx-mid">
        {hasPending
          ? "Someone's waiting to connect with you."
          : "This app needs two people. Invite the one you'd send a song to at midnight."}
      </p>
      <div className="mt-3 flex w-full max-w-xs flex-col gap-2.5">
        <ButtonLink
          href={hasPending ? "/friends/add?tab=requests" : "/friends/add"}
          full
        >
          {hasPending ? "See who it is" : "Invite someone"}
        </ButtonLink>
        <ButtonLink href="/friends/add?tab=search" variant="ghost" full>
          Search by username
        </ButtonLink>
      </div>
    </div>
  );
}
