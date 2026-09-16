"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Who is online right now.
 *
 * One shared Realtime Presence channel rather than per-conversation ones, so
 * the count of connections stays flat as someone's friend list grows — the
 * free tier caps concurrent connections, and N channels per user would burn
 * through it fast.
 *
 * Nothing is tracked when the user has turned presence off: they are then
 * genuinely invisible rather than merely hidden in the UI, which is the only
 * version of that setting worth offering.
 */
const PresenceContext = createContext<Set<string>>(new Set());

export function useOnlineUsers() {
  return useContext(PresenceContext);
}

export function usePresenceOf(userId: string | null | undefined) {
  const online = useOnlineUsers();
  return userId ? online.has(userId) : false;
}

export function PresenceProvider({
  meId,
  enabled,
  children,
}: {
  meId: string;
  /** The user's own "show my online status" setting. */
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [client] = useState(() => createClient());

  useEffect(() => {
    const channel = client.channel("presence:global", {
      config: { presence: { key: meId } },
    });

    const refresh = () => {
      const state = channel.presenceState<{ userId: string }>();
      const ids = new Set<string>();
      for (const entries of Object.values(state)) {
        for (const entry of entries) {
          if (entry.userId) ids.add(entry.userId);
        }
      }
      setOnline(ids);
    };

    channel
      .on("presence", { event: "sync" }, refresh)
      .on("presence", { event: "join" }, refresh)
      .on("presence", { event: "leave" }, refresh)
      .subscribe(async (status) => {
        // Subscribe either way so we can still SEE others; only announce
        // ourselves when the setting allows it.
        if (status === "SUBSCRIBED" && enabled) {
          await channel.track({ userId: meId });
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [client, meId, enabled]);

  const value = useMemo(() => online, [online]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
