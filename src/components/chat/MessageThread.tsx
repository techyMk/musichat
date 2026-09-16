"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toMessage,
  shouldGroup,
  formatTime,
  formatDayLabel,
  receiptFor,
  type Message,
  type Watermark,
  type ReceiptState,
} from "@/lib/messages";
import { usePlayer } from "@/components/player/PlayerProvider";
import { Artwork } from "@/components/player/Artwork";
import { PlayPauseIcon } from "@/components/player/controls";
import { MessageActions } from "./MessageActions";
import { Composer, type ReplyTarget } from "./Composer";
import { useTyping } from "./useTyping";
import { cn } from "@/lib/cn";
import type { Track } from "@/lib/music/types";

export function MessageThread({
  friendshipId,
  meId,
  partnerName,
  initialMessages,
  initialWatermark,
  readReceipts,
}: {
  friendshipId: string;
  meId: string;
  partnerName: string;
  initialMessages: Message[];
  initialWatermark: Watermark | null;
  /** Reciprocal: turning receipts off also hides theirs (UX.md §10.3). */
  readReceipts: boolean;
}) {
  const { partnerTyping, notifyTyping } = useTyping({ friendshipId, meId });
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [partner, setPartner] = useState<Watermark | null>(initialWatermark);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [client] = useState(() => createClient());
  const bottomRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(
    () => new Map(messages.map((m) => [m.id, m])),
    [messages],
  );

  /** Moves our own watermark forward. Read only when the tab is actually visible. */
  const mark = useCallback(
    (read: boolean) => {
      void client.rpc("mark_conversation", {
        target_friendship: friendshipId,
        delivered: true,
        // With receipts off we still record delivery, so unread counts stay
        // correct — we just never tell the other side we read it.
        read: read && readReceipts,
      });
    },
    [client, friendshipId, readReceipts],
  );

  /* ---------------- realtime ---------------- */

  useEffect(() => {
    const channel = client
      .channel(`thread:${friendshipId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `friendship_id=eq.${friendshipId}`,
        },
        (payload) => {
          const incoming = toMessage(payload.new as never);
          setMessages((current) =>
            current.some((m) => m.id === incoming.id)
              ? current
              : [...current, incoming],
          );
          // Their message reached our device; mark read too if we are looking.
          mark(document.visibilityState === "visible");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `friendship_id=eq.${friendshipId}`,
        },
        (payload) => {
          const updated = toMessage(payload.new as never);
          setMessages((current) =>
            current.map((m) => (m.id === updated.id ? updated : m)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendship_reads",
          filter: `friendship_id=eq.${friendshipId}`,
        },
        (payload) => {
          const row = payload.new as {
            user_id: string;
            last_delivered_at: string;
            last_read_at: string;
          };
          if (!row?.user_id || row.user_id === meId) return;
          setPartner({
            userId: row.user_id,
            lastDeliveredAt: row.last_delivered_at,
            lastReadAt: row.last_read_at,
          });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [client, friendshipId, meId, mark]);

  /* ---------------- read state ---------------- */

  useEffect(() => {
    mark(document.visibilityState === "visible");

    // Coming back to the tab is what turns delivered into read.
    const onVisible = () => {
      if (document.visibilityState === "visible") mark(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [mark]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  /* ---------------- actions ---------------- */

  const remove = async (message: Message) => {
    // A tombstone, so the other side sees something was removed rather than
    // history quietly changing (FR-C9).
    setMessages((cur) =>
      cur.map((m) =>
        m.id === message.id
          ? { ...m, deletedAt: new Date().toISOString(), body: null }
          : m,
      ),
    );
    await client
      .from("messages")
      .update({ deleted_at: new Date().toISOString(), body: null })
      .eq("id", message.id);
  };

  const applyEdit = async (message: Message, body: string) => {
    const editedAt = new Date().toISOString();
    setMessages((cur) =>
      cur.map((m) => (m.id === message.id ? { ...m, body, editedAt } : m)),
    );
    setEditing(null);
    await client
      .from("messages")
      .update({ body, edited_at: editedAt })
      .eq("id", message.id);
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyThread partnerName={partnerName} />
        ) : (
          <ol className="flex flex-col">
            {messages.map((message, i) => {
              const previous = messages[i - 1];
              const mine = message.senderId === meId;
              const newDay =
                !previous ||
                formatDayLabel(previous.createdAt) !==
                  formatDayLabel(message.createdAt);

              return (
                <li key={message.id} className="contents">
                  {newDay && (
                    <div className="my-3 text-center text-[11px] font-semibold text-tx-lo">
                      {formatDayLabel(message.createdAt)}
                    </div>
                  )}
                  <MessageRow
                    message={message}
                    mine={mine}
                    grouped={shouldGroup(previous, message)}
                    repliedTo={
                      message.replyToId ? byId.get(message.replyToId) : undefined
                    }
                    receipt={
                      mine && readReceipts ? receiptFor(message, partner) : null
                    }
                    onReply={() =>
                      setReplyTo({
                        id: message.id,
                        preview:
                          message.kind === "track"
                            ? (message.trackRef?.title ?? "a song")
                            : (message.body ?? ""),
                        mine,
                      })
                    }
                    onEdit={() => setEditing(message)}
                    onDelete={() => void remove(message)}
                  />
                </li>
              );
            })}
          </ol>
        )}
        {partnerTyping && (
          <div className="mt-2 flex items-center gap-2 self-start px-1">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-them-400 motion-safe:animate-bounce"
                  style={{ animationDelay: `${i * 140}ms` }}
                />
              ))}
            </span>
            <span className="text-[11.5px] text-tx-lo">
              {partnerName} is typing
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <Composer
        friendshipId={friendshipId}
        meId={meId}
        onTyping={notifyTyping}
        replyTo={replyTo}
        editing={editing}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditing(null)}
        onSubmitEdit={applyEdit}
        onSent={(optimistic) => {
          setMessages((cur) => [...cur, optimistic]);
          setReplyTo(null);
        }}
        onConfirmed={(tempId, saved) =>
          setMessages((cur) => cur.map((m) => (m.id === tempId ? saved : m)))
        }
        onFailed={(tempId) =>
          setMessages((cur) => cur.filter((m) => m.id !== tempId))
        }
      />
    </>
  );
}

function MessageRow({
  message,
  mine,
  grouped,
  repliedTo,
  receipt,
  onReply,
  onEdit,
  onDelete,
}: {
  message: Message;
  mine: boolean;
  grouped: boolean;
  repliedTo: Message | undefined;
  receipt: ReceiptState | null;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (message.kind === "system") {
    return (
      <div className="my-1 text-center text-[11px] text-tx-lo">
        {message.body}
      </div>
    );
  }

  const deleted = Boolean(message.deletedAt);

  return (
    <div
      className={cn(
        "group flex items-end gap-1",
        mine ? "flex-row-reverse self-end" : "self-start",
        grouped ? "mt-0.5" : "mt-2",
        "max-w-[86%]",
      )}
    >
      <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
        {repliedTo && (
          <div
            className={cn(
              "mb-1 max-w-full truncate border-l-2 px-2 py-1 text-[11.5px]",
              mine
                ? "border-you-500 text-tx-mid"
                : "border-them-500 text-tx-mid",
            )}
          >
            {repliedTo.deletedAt
              ? "Message deleted"
              : repliedTo.kind === "track"
                ? (repliedTo.trackRef?.title ?? "a song")
                : repliedTo.body}
          </div>
        )}

        {message.kind === "track" && message.trackRef ? (
          <TrackCard track={message.trackRef} mine={mine} />
        ) : (
          <div
            className={cn(
              "px-3.5 py-2.5 text-[13.5px] leading-relaxed break-words whitespace-pre-wrap",
              mine
                ? "rounded-[var(--r-lg)] rounded-br-[6px] border border-[rgba(255,79,151,0.36)] bg-[linear-gradient(135deg,rgba(255,79,151,0.32),rgba(162,77,238,0.2))]"
                : "rounded-[var(--r-lg)] rounded-bl-[6px] border border-[rgba(59,141,255,0.3)] bg-[rgba(59,141,255,0.17)]",
              deleted ? "text-tx-lo italic" : "text-tx-hi",
            )}
          >
            {deleted ? "Message deleted" : message.body}
          </div>
        )}

        {!grouped && (
          <span className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-tx-lo">
            <span className="tabular-nums">{formatTime(message.createdAt)}</span>
            {message.editedAt && !deleted && <span>edited</span>}
            {receipt && <Receipt state={receipt} />}
          </span>
        )}
      </div>

      {!deleted && (
        <MessageActions
          mine={mine}
          canEdit={message.kind === "text"}
          align={mine ? "right" : "left"}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

/** Sending → sent → delivered → read, per FR-C4. */
function Receipt({ state }: { state: ReceiptState }) {
  const label = {
    sending: "Sending",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
  }[state];

  return (
    <span
      className={cn(
        "font-semibold",
        state === "read" ? "text-you-400" : "text-tx-lo",
      )}
    >
      {label}
    </span>
  );
}

function TrackCard({
  track,
  mine,
}: {
  track: NonNullable<Message["trackRef"]>;
  mine: boolean;
}) {
  const player = usePlayer();
  const active = player.track?.id === track.id;

  const playable: Track = {
    id: track.id,
    provider: track.provider as Track["provider"],
    providerTrackId: track.providerTrackId,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artworkUrl,
    durationMs: track.durationMs,
    license: null,
    sourceUrl: null,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 border border-ink-500 bg-ink-700 p-2.5",
        mine
          ? "rounded-[var(--r-lg)] rounded-br-[6px]"
          : "rounded-[var(--r-lg)] rounded-bl-[6px]",
      )}
    >
      <Artwork
        src={track.artworkUrl}
        alt=""
        className="h-11 w-11"
        rounded="rounded-[10px]"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-tx-hi">{track.title}</p>
        <p className="truncate text-[11.5px] text-tx-mid">{track.artist}</p>
      </div>
      <button
        type="button"
        onClick={() => (active ? player.toggle() : player.play(playable))}
        aria-label={active && player.isPlaying ? "Pause" : `Play ${track.title}`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[image:var(--together)] text-white"
      >
        <PlayPauseIcon
          playing={active && player.isPlaying}
          loading={active && player.loading}
          size={14}
        />
      </button>
    </div>
  );
}

function EmptyThread({ partnerName }: { partnerName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <h2 className="font-display text-[21px] leading-tight font-bold tracking-tight text-tx-hi">
        Say something to {partnerName}
      </h2>
      <p className="max-w-[32ch] text-[13px] leading-relaxed text-tx-mid">
        Or send a song. Whatever you play here, they&apos;ll be able to hear
        with you once shared sessions land.
      </p>
    </div>
  );
}
