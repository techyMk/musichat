"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, AddPersonIcon, PersonIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Primary navigation for signed-in screens.
 *
 * UX.md §3.1 rules out a bottom tab bar — the mini player needs that edge —
 * and said the trade would be mitigated by a clear header action. An unlabelled
 * "+" was not that, and left About, Privacy and the profile unreachable once
 * signed in. Labelled destinations fix the discoverability without taking the
 * bottom edge back.
 */
const ITEMS = [
  { href: "/chats", label: "Chats", Icon: ChatIcon },
  { href: "/friends/add", label: "Add a friend", Icon: AddPersonIcon, badge: true },
  { href: "/me", label: "Your profile", Icon: PersonIcon },
] as const;

export function AppNav({
  pendingCount = 0,
  onNavigate,
}: {
  pendingCount?: number;
  /** Lets the mobile drawer close itself when a destination is chosen. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {ITEMS.map(({ href, label, Icon, ...rest }) => {
        const active =
          href === "/chats"
            ? pathname === "/chats" || pathname.startsWith("/chats/")
            : pathname.startsWith(href);
        const badge = "badge" in rest && rest.badge ? pendingCount : 0;

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5 text-[13.5px] font-semibold",
              "transition-colors duration-[var(--dur-fast)]",
              active
                ? "bg-ink-700 text-tx-hi"
                : "text-tx-mid hover:bg-ink-700/60 hover:text-tx-hi",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-you-500 px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function LegalLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-tx-lo">
      {[
        { href: "/about", label: "About" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
      ].map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNavigate}
          className="transition-colors duration-[var(--dur-fast)] hover:text-tx-mid"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
