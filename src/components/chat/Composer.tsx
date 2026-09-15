"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toMessage, MESSAGE_COLUMNS, type Message } from "@/lib/messages";
import { cn } from "@/lib/cn";

const MAX_LENGTH = 4000;

export type ReplyTarget = { id: string; preview: string; mine: boolean };

/**
 * Message input, plus reply and edit modes.
 *
 * Sending is optimistic: the bubble appears immediately and reconciles when the
 * insert returns. A message that takes 300ms to show reads as broken even when
 * nothing is wrong. A failed send restores the text rather than discarding it —
 * typed input is never lost (FR-C7).
 */
export function Composer({
  friendshipId,
  meId,
  replyTo,
  editing,
  onCancelReply,
  onCancelEdit,
  onSubmitEdit,
  onSent,
  onConfirmed,
  onFailed,
}: {
  friendshipId: string;
  meId: string;
  replyTo: ReplyTarget | null;
  editing: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (message: Message, body: string) => void | Promise<void>;
  onSent: (optimistic: Message) => void;
  onConfirmed: (tempId: string, saved: Message) => void;
  onFailed: (tempId: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [client] = useState(() => createClient());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Entering edit mode loads the existing text. Adjusted during render rather
  // than in an effect — this is state derived from a prop change, and doing it
  // in an effect would render once with the wrong value first.
  const [editingId, setEditingId] = useState<string | null>(editing?.id ?? null);
  if ((editing?.id ?? null) !== editingId) {
    setEditingId(editing?.id ?? null);
    setValue(editing?.body ?? "");
  }

  // Focus is a DOM side effect, so it does belong here.
  useEffect(() => {
    if (editing || replyTo) inputRef.current?.focus();
  }, [editing, replyTo]);

  const reset = () => {
    setValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const submit = async () => {
    const body = value.trim();
    if (!body) return;

    if (editing) {
      await onSubmitEdit(editing, body);
      reset();
      return;
    }

    const tempId = `pending-${crypto.randomUUID()}`;
    const optimistic: Message = {
      id: tempId,
      friendshipId,
      senderId: meId,
      kind: "text",
      body,
      trackRef: null,
      replyToId: replyTo?.id ?? null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
    };

    reset();
    setError(null);
    onSent(optimistic);

    const { data, error: insertError } = await client
      .from("messages")
      .insert({
        friendship_id: friendshipId,
        sender_id: meId,
        body,
        kind: "text",
        reply_to_id: replyTo?.id ?? null,
      })
      .select(MESSAGE_COLUMNS)
      .single();

    if (insertError || !data) {
      onFailed(tempId);
      setValue(body);
      setError("That didn't send. Check your connection and try again.");
      return;
    }

    onConfirmed(tempId, toMessage(data as never));
  };

  const cancel = () => {
    if (editing) onCancelEdit();
    if (replyTo) onCancelReply();
    reset();
  };

  const context = editing
    ? { label: "Editing", preview: editing.body ?? "" }
    : replyTo
      ? { label: replyTo.mine ? "Replying to yourself" : "Replying", preview: replyTo.preview }
      : null;

  return (
    <div className="shrink-0 border-t border-ink-600 px-3 py-3">
      {context && (
        <div className="mb-2 flex items-start gap-2 rounded-[var(--r-sm)] border-l-2 border-you-500 bg-ink-700/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-you-400">{context.label}</p>
            <p className="truncate text-[12px] text-tx-mid">{context.preview}</p>
          </div>
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel"
            className="shrink-0 text-[15px] leading-none text-tx-lo hover:text-tx-hi"
          >
            ×
          </button>
        </div>
      )}

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
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
          }}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter is a newline. Escape leaves edit or
            // reply mode without losing the thread position.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
            if (e.key === "Escape" && context) {
              e.preventDefault();
              cancel();
            }
          }}
          placeholder={editing ? "Edit your message" : "Message"}
          aria-label={editing ? "Edit message" : "Message"}
          className={cn(
            "max-h-[140px] min-h-[42px] flex-1 resize-none rounded-[var(--r-lg)] border bg-ink-700",
            "px-4 py-2.5 text-[13.5px] leading-relaxed text-tx-hi outline-none",
            "placeholder:text-tx-lo focus:border-you-500",
            editing ? "border-you-500" : "border-ink-500",
          )}
        />

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!value.trim()}
          aria-label={editing ? "Save edit" : "Send"}
          className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[image:var(--together)] text-white transition-[filter,opacity] duration-[var(--dur-fast)] hover:brightness-110 disabled:opacity-40"
        >
          {editing ? (
            <svg
              viewBox="0 0 20 20"
              width={17}
              height={17}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m4.5 10.5 3.5 3.5 7.5-8" />
            </svg>
          ) : (
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
          )}
        </button>
      </div>
    </div>
  );
}
