import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import {
  conversationName,
  previewOf,
  shortTime,
  type ConversationSummary,
} from "@/lib/conversations";
import { cn } from "@/lib/cn";

/**
 * The home list. Name, photo, last message, time, unread count, and the
 * vibing indicator — the single most important glanceable signal in the app,
 * because seeing someone listening is what prompts you to join them.
 */
export function ConversationList({
  conversations,
  meId,
  activeId,
  compact = false,
}: {
  conversations: ConversationSummary[];
  meId: string;
  activeId?: string;
  /** Rail variant: tighter, no timestamp column. */
  compact?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {conversations.map((c) => {
        const name = conversationName(c);
        const active = c.friendshipId === activeId;
        const unread = c.unreadCount > 0;

        return (
          <li key={c.friendshipId}>
            <Link
              href={`/chats/${c.friendshipId}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--r-md)] px-2.5 py-2.5",
                "transition-colors duration-[var(--dur-fast)]",
                active ? "bg-ink-700 ring-1 ring-ink-500" : "hover:bg-ink-700/70",
              )}
            >
              <Avatar
                name={name}
                src={c.avatarUrl}
                size="lg"
                vibing={c.isVibing}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p
                    className={cn(
                      "min-w-0 flex-1 truncate text-[14.5px]",
                      unread ? "font-bold text-tx-hi" : "font-bold text-tx-hi",
                    )}
                  >
                    {name}
                  </p>
                  {!compact && c.lastAt && (
                    <span
                      className={cn(
                        "shrink-0 text-[10.5px] tabular-nums",
                        unread ? "font-bold text-you-500" : "text-tx-lo",
                      )}
                    >
                      {shortTime(c.lastAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "min-w-0 flex-1 truncate text-[12.5px]",
                      c.isVibing
                        ? "bg-[image:var(--together)] bg-clip-text font-bold text-transparent"
                        : unread
                          ? "font-semibold text-tx-hi"
                          : "text-tx-mid",
                    )}
                  >
                    {previewOf(c, meId)}
                  </p>

                  {unread && (
                    <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-you-500 px-1.5 text-[10.5px] font-bold text-white">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
