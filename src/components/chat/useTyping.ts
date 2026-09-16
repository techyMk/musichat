"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CLEAR_AFTER_MS = 3000;
/** Re-announce at most this often while someone keeps typing. */
const THROTTLE_MS = 1500;

/**
 * Typing indicator over Realtime Broadcast rather than the database.
 *
 * Typing is ephemeral by definition — writing a row per keystroke would be
 * pure noise in a table that exists to hold permanent messages, and would
 * replicate to every listener as a change event.
 */
export function useTyping({
  friendshipId,
  meId,
}: {
  friendshipId: string;
  meId: string;
}) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [client] = useState(() => createClient());

  const channelRef = useRef<ReturnType<typeof client.channel> | null>(null);
  const lastSentRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = client.channel(`typing:${friendshipId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if ((payload as { userId?: string })?.userId === meId) return;

        setPartnerTyping(true);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        // Cleared on a timer rather than on a "stopped" event, which would
        // never arrive if they closed the tab mid-sentence.
        clearTimerRef.current = setTimeout(
          () => setPartnerTyping(false),
          CLEAR_AFTER_MS,
        );
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      void client.removeChannel(channel);
      channelRef.current = null;
    };
  }, [client, friendshipId, meId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;

    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: meId },
    });
  }, [meId]);

  return { partnerTyping, notifyTyping };
}
