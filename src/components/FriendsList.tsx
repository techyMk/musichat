import Image from "next/image";
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
  /** Highlights the open conversation in the desktop rail. */
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
                active
                  ? "bg-ink-700 ring-1 ring-ink-500"
                  : "hover:bg-ink-700/70",
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

/**
 * The most important empty state in the app. Nearly every new account sees
 * this before anything else, so it has to explain the product and route
 * straight into inviting — not just report that a list is empty.
 */
export function FriendsEmptyState({ hasPending }: { hasPending: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-7">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,79,151,0.35), transparent 70%)",
          }}
        />
        <Image
          src="/brand/icon-transparent.png"
          alt=""
          width={88}
          height={88}
          className="opacity-90"
        />
      </div>

      <h2 className="font-display mb-2 text-[26px] leading-tight font-bold tracking-tight text-tx-hi">
        {hasPending ? "Someone's waiting" : "It's quiet in here"}
      </h2>

      <p className="mb-7 max-w-[34ch] text-[13.5px] leading-relaxed text-balance text-tx-mid">
        {hasPending
          ? "A request came in. Accept it and you can start listening together."
          : "MusiChat needs two people. Invite the one you'd send a song to at midnight — they'll land straight in a chat with you."}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-2.5">
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
