import Link from "next/link";
import { cn } from "@/lib/cn";

export function AddFriendButton({
  count,
  className,
}: {
  /** Pending incoming requests, badged so they are not missed. */
  count: number;
  className?: string;
}) {
  return (
    <Link
      href="/friends/add"
      aria-label={
        count > 0
          ? `Add a friend — ${count} request waiting`
          : "Add a friend"
      }
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-700 text-[17px] text-tx-mid",
        "transition-colors duration-[var(--dur-fast)] hover:text-tx-hi",
        className,
      )}
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
