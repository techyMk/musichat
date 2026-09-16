"use client";

import { usePresenceOf } from "./PresenceProvider";

/**
 * Online status in the conversation header.
 *
 * Absence is not "offline" — it can equally mean they have presence turned
 * off. So nothing is shown at all rather than asserting they are away, which
 * would be a claim we cannot actually make.
 */
export function PresenceLine({
  userId,
  fallback,
}: {
  userId: string;
  fallback: string;
}) {
  const online = usePresenceOf(userId);

  if (!online) {
    return <span className="truncate text-[11.5px] text-tx-lo">{fallback}</span>;
  }

  return (
    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-online">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-online" />
      Online
    </span>
  );
}

export function PresenceRing({ userId }: { userId: string }) {
  const online = usePresenceOf(userId);
  if (!online) return null;

  return (
    <span className="absolute right-0 bottom-0 h-[11px] w-[11px] rounded-full border-[2.5px] border-ink-800 bg-online">
      <span className="sr-only">Online</span>
    </span>
  );
}
