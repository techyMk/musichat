"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SyncStatus } from "./useSession";

/**
 * What the full player needs to know about the live session.
 *
 * The session lives inside a conversation, but the player is mounted in the
 * app layout so it survives navigation — so the two cannot talk by props.
 * This is the thin channel between them: who you're with, and whether you're
 * actually together right now.
 */
export type SessionPresence = {
  partnerName: string;
  partnerAvatarUrl: string | null;
  myName: string;
  myAvatarUrl: string | null;
  status: SyncStatus;
  driftMs: number;
  /** Nobody else has joined yet — normal, not an error (PRD A1). */
  alone: boolean;
};

type Ctx = {
  presence: SessionPresence | null;
  setPresence: (p: SessionPresence | null) => void;
};

const SessionContext = createContext<Ctx>({
  presence: null,
  setPresence: () => {},
});

export function useSessionPresence() {
  return useContext(SessionContext);
}

export function SessionPresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [presence, setPresence] = useState<SessionPresence | null>(null);
  const value = useMemo(() => ({ presence, setPresence }), [presence]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
