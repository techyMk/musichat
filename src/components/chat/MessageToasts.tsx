"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";

type Sender = {
  friendshipId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
};

type Toast = {
  key: string;
  friendshipId: string;
  name: string;
  avatarUrl: string | null;
  preview: string;
};

const VISIBLE_MS = 6000;
const MAX_STACK = 3;

/**
 * Notifies about messages arriving in conversations you are not looking at.
 *
 * Subscribes to the whole messages table rather than per-conversation channels:
 * Realtime applies the same RLS as a normal query, so only rows from your own
 * conversations are ever delivered. One subscription instead of N.
 *
 * Until the Capacitor wrapper brings real push (PRD §9.4), this is the only
 * way a message announces itself while the app is open elsewhere.
 */
export function MessageToasts({
  meId,
  senders,
}: {
  meId: string;
  senders: Sender[];
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [client] = useState(() => createClient());
  const pathname = usePathname();

  useEffect(() => {
    const byFriendship = new Map(senders.map((s) => [s.friendshipId, s]));

    const channel = client
      .channel("messages:all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as {
            id: string;
            friendship_id: string;
            sender_id: string;
            kind: string;
            body: string | null;
            track_ref: { title?: string } | null;
          };

          if (row.sender_id === meId) return;
          // Already on screen — the thread itself is the notification.
          if (pathname === `/chats/${row.friendship_id}`) return;

          const sender = byFriendship.get(row.friendship_id);
          if (!sender) return;

          const preview =
            row.kind === "track"
              ? `♪ ${row.track_ref?.title ?? "sent a song"}`
              : (row.body ?? "");

          setToasts((current) =>
            [
              ...current.filter((t) => t.friendshipId !== row.friendship_id),
              {
                key: row.id,
                friendshipId: row.friendship_id,
                name: sender.name,
                avatarUrl: sender.avatarUrl,
                preview,
              },
            ].slice(-MAX_STACK),
          );

          setTimeout(
            () => setToasts((cur) => cur.filter((t) => t.key !== row.id)),
            VISIBLE_MS,
          );
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [client, meId, senders, pathname]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-3 pt-3"
    >
      {toasts.map((toast) => (
        <Link
          key={toast.key}
          href={`/chats/${toast.friendshipId}`}
          onClick={() =>
            setToasts((cur) => cur.filter((t) => t.key !== toast.key))
          }
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[var(--r-lg)] border border-ink-500 bg-ink-700/95 p-3 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-transform duration-[var(--dur-fast)] hover:scale-[1.01]"
        >
          <Avatar name={toast.name} src={toast.avatarUrl} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold text-tx-hi">
              {toast.name}
            </span>
            <span className="block truncate text-[12px] text-tx-mid">
              {toast.preview}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-[15px] text-tx-lo"
          >
            ›
          </span>
        </Link>
      ))}
    </div>
  );
}
