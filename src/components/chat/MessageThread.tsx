"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toMessage,
  shouldGroup,
  formatTime,
  formatDayLabel,
  type Message,
} from "@/lib/messages";
import { usePlayer } from "@/components/player/PlayerProvider";
import { Artwork } from "@/components/player/Artwork";
import { PlayPauseIcon } from "@/components/player/controls";
import { Composer } from "./Composer";
import { cn } from "@/lib/cn";
import type { Track } from "@/lib/music/types";

/**
 * The conversation.
 *
 * DESIGN.md §5.1: no tails, and the corner nearest the sender drops to 6px.
 * You are Rose and they are Azure, on every device — the rule holds because
 * "you" is always whoever is holding the phone.
 */
export function MessageThread({
  friendshipId,
  meId,
  partnerName,
  initialMessages,
}: {
  friendshipId: string;
  meId: string;
  partnerName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [client] = useState(() => createClient());
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ---------------- realtime ---------------- */

  useEffect(() => {
    const channel = client
      .channel(`messages:${friendshipId}`)
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
          setMessages((current) => {
            // Our own message already rendered optimistically; the insert
            // event is the confirmation, not a second message.
            if (current.some((m) => m.id === incoming.id)) return current;
            return [...current, incoming];
          });
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
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [client, friendshipId]);

  /* ---------------- keep the newest message in view ---------------- */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const onSent = (optimistic: Message) =>
    setMessages((current) => [...current, optimistic]);

  const onConfirmed = (tempId: string, saved: Message) =>
    setMessages((current) =>
      current.map((m) => (m.id === tempId ? saved : m)),
    );

  const onFailed = (tempId: string) =>
    setMessages((current) => current.filter((m) => m.id !== tempId));

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyThread partnerName={partnerName} />
        ) : (
          <ol className="flex flex-col gap-1.5">
            {messages.map((message, i) => {
              const previous = messages[i - 1];
              const grouped = shouldGroup(previous, message);
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
                    mine={message.senderId === meId}
                    grouped={grouped}
                  />
                </li>
              );
            })}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      <Composer
        friendshipId={friendshipId}
        meId={meId}
        onSent={onSent}
        onConfirmed={onConfirmed}
        onFailed={onFailed}
      />
    </>
  );
}

function MessageRow({
  message,
  mine,
  grouped,
}: {
  message: Message;
  mine: boolean;
  grouped: boolean;
}) {
  if (message.kind === "system") {
    return (
      <div className="my-1 text-center text-[11px] text-tx-lo">
        {message.body}
      </div>
    );
  }

  if (message.kind === "track" && message.trackRef) {
    return <TrackCard track={message.trackRef} mine={mine} />;
  }

  const deleted = Boolean(message.deletedAt);

  return (
    <div
      className={cn(
        "flex max-w-[78%] flex-col",
        mine ? "self-end items-end" : "self-start items-start",
        grouped ? "mt-0" : "mt-1.5",
      )}
    >
      <div
        className={cn(
          "px-3.5 py-2.5 text-[13.5px] leading-relaxed",
          mine
            ? "rounded-[var(--r-lg)] rounded-br-[6px] border border-[rgba(255,79,151,0.36)] bg-[linear-gradient(135deg,rgba(255,79,151,0.32),rgba(162,77,238,0.2))]"
            : "rounded-[var(--r-lg)] rounded-bl-[6px] border border-[rgba(59,141,255,0.3)] bg-[rgba(59,141,255,0.17)]",
          deleted ? "text-tx-lo italic" : "text-tx-hi",
          // Long unbroken strings would otherwise stretch the bubble.
          "break-words whitespace-pre-wrap",
        )}
      >
        {deleted ? "Message deleted" : message.body}
      </div>
      {!grouped && (
        <span className="mt-1 px-1 text-[10px] text-tx-lo tabular-nums">
          {formatTime(message.createdAt)}
        </span>
      )}
    </div>
  );
}

/** A song shared into the conversation. What stops this reading as a generic messenger. */
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
        "mt-1.5 flex max-w-[84%] items-center gap-3 border border-ink-500 bg-ink-700 p-2.5",
        mine
          ? "self-end rounded-[var(--r-lg)] rounded-br-[6px]"
          : "self-start rounded-[var(--r-lg)] rounded-bl-[6px]",
      )}
    >
      <Artwork
        src={track.artworkUrl}
        alt=""
        className="h-11 w-11"
        rounded="rounded-[10px]"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-tx-hi">
          {track.title}
        </p>
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
