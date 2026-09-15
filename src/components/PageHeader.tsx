import Link from "next/link";

/**
 * Header for a screen inside the app shell.
 *
 * The back chevron is a phone affordance and is hidden on desktop, where the
 * persistent rail already shows you where you are — a back arrow beside a
 * visible sidebar is a leftover from a layout that no longer applies.
 */
export function PageHeader({
  title,
  backHref = "/chats",
  backLabel = "Back to chats",
  action,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-2.5 border-b border-ink-600 px-4 py-3.5 sm:px-5">
      <Link
        href={backHref}
        aria-label={backLabel}
        className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[18px] text-tx-mid transition-colors duration-[var(--dur-fast)] hover:bg-ink-700 hover:text-tx-hi lg:hidden"
      >
        ‹
      </Link>
      <h1 className="flex-1 truncate text-[16px] font-bold text-tx-hi">
        {title}
      </h1>
      {action}
    </header>
  );
}
