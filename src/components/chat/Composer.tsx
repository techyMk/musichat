"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toMessage, type Message } from "@/lib/messages";

const MAX_LENGTH = 4000;

/**
 * Message input.
 *
 * Sends optimistically: the bubble appears immediately and reconciles when the
 * insert returns. A message that takes 300ms to appear reads as broken even
 * when nothing is wrong.
 *
 * A failed send restores the text rather than discarding it — FR-C7 and the
 * error rules in DESIGN.md §9 both say typed input is never lost.
 */
export function Composer({
  friendshipId,
  meId,
  onSent,
  onConfirmed,
  onFailed,
}: {
  friendshipId: string;
  meId: string;
  onSent: (optimistic: Message) => void;
  onConfirmed: (tempId: string, saved: Message) => void;
  onFailed: (tempId: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [client] = useState(() => createClient());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = async () => {
    const body = value.trim();
    if (!body) return;

    const tempId = `pending-${crypto.randomUUID()}`;
    const optimistic: Message = {
      id: tempId,
      friendshipId,
      senderId: meId,
      kind: "text",
      body,
      trackRef: null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    setValue("");
    setError(null);
    onSent(optimistic);

    const { data, error: insertError } = await client
      .from("messages")
      .insert({ friendship_id: friendshipId, sender_id: meId, body, kind: "text" })
      .select("id, friendship_id, sender_id, kind, body, track_ref, created_at, deleted_at")
      .single();

    if (insertError || !data) {
      onFailed(tempId);
      setValue(body);
      setError("That didn't send. Check your connection and try again.");
      return;
    }

    onConfirmed(tempId, toMessage(data as never));
  };

  return (
    <div className="border-t border-ink-600 px-3 py-3">
      {error && (
        <p role="alert" className="mb-2 px-1 text-[12px] text-danger">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          onChange={(e) => {
            setValue(e.target.value);
            // Grow with the content, capped so it never swallows the thread.
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
          }}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter is a newline. On touch keyboards Enter
            // is usually a newline key, which is why the send button stays.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Message"
          aria-label="Message"
          className="max-h-[140px] min-h-[42px] flex-1 resize-none rounded-[var(--r-lg)] border border-ink-500 bg-ink-700 px-4 py-2.5 text-[13.5px] leading-relaxed text-tx-hi outline-none placeholder:text-tx-lo focus:border-you-500"
        />

        <button
          type="button"
          onClick={() => void send()}
          disabled={!value.trim()}
          aria-label="Send"
          className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[image:var(--together)] text-white transition-[filter,opacity] duration-[var(--dur-fast)] hover:brightness-110 disabled:opacity-40"
        >
          <svg
            viewBox="0 0 20 20"
            width={17}
            height={17}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 16V4M5 9l5-5 5 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
