"use client";

import { useEffect, useState } from "react";
import { useSession } from "./useSession";
import { useSessionPresence } from "./SessionContext";
import { describeAction, type ListeningSession } from "@/lib/session";
import { usePlayer } from "@/components/player/PlayerProvider";
import { Artwork } from "@/components/player/Artwork";
import { TrackSearch } from "@/components/player/TrackSearch";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";

/**
 * The shared session, inside the conversation.
 *
 * Solo is a normal state, not an error (PRD assumption A1) — you start
 * listening before your partner is online and they join at the live position.
 * The copy stays warm rather than apologetic.
 */
export function SessionBar({
  friendshipId,
  meId,
  partnerName,
  partnerAvatarUrl,
  myName,
  myAvatarUrl,
  initialSession,
}: {
  friendshipId: string;
  meId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  myName: string;
  myAvatarUrl: string | null;
  initialSession: ListeningSession | null;
}) {
  const s = useSession({ friendshipId, meId, partnerName, initialSession });
  const player = usePlayer();
  const { setPresence } = useSessionPresence();
  const [picking, setPicking] = useState(false);

  // The player is mounted in the app layout so it survives navigation, which
  // means it cannot receive this by props. Published here instead.
  useEffect(() => {
    if (!s.active) {
      setPresence(null);
      return;
    }
    setPresence({
      partnerName,
      partnerAvatarUrl,
      myName,
      myAvatarUrl,
      status: s.status,
      driftMs: s.drift,
      alone: !s.partnerPresent,
    });
    return () => setPresence(null);
  }, [
    s.active,
    s.status,
    s.drift,
    s.session?.lastActionBy,
    s.session?.startedBy,
    s.partnerPresent,
    partnerName,
    partnerAvatarUrl,
    myName,
    myAvatarUrl,
    meId,
    setPresence,
  ]);

  const attribution = s.session
    ? describeAction(s.session, meId, partnerName)
    : null;

  if (!s.active) {
    return (
      <>
        <div className="shrink-0 border-b border-ink-600 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex w-full items-center gap-2.5 rounded-full bg-[image:var(--together)] px-4 py-2.5 text-[13px] font-bold text-white transition-[filter] duration-[var(--dur-fast)] hover:brightness-110"
          >
            <span className="grid h-5 w-5 place-items-center">♪</span>
            <span className="flex-1 text-left">
              Start vibing with {partnerName}
            </span>
          </button>
        </div>
        {picking && (
          <TrackPicker
            title={`Pick something for you and ${partnerName}`}
            onClose={() => setPicking(false)}
            onPick={(track) => {
              setPicking(false);
              void s.start(track);
            }}
          />
        )}
      </>
    );
  }

  const track = s.session?.trackRef;

  return (
    <>
      <div className="shrink-0 border-b border-ink-600 bg-[linear-gradient(100deg,rgba(59,141,255,0.1),rgba(255,79,151,0.1))] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Artwork
            src={track?.artworkUrl ?? null}
            alt=""
            className="h-10 w-10"
            rounded="rounded-[10px]"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate bg-[image:var(--together)] bg-clip-text text-[10px] font-bold tracking-[0.1em] text-transparent uppercase">
              Vibing with {partnerName}
            </p>
            <p className="truncate text-[13px] font-bold text-tx-hi">
              {track?.title ?? "Nothing playing"}
            </p>
            {attribution && (
              <p className="truncate text-[11px] text-tx-lo">{attribution}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SyncBadge status={s.status} drift={s.drift} />
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="rounded-full border border-ink-500 px-3 py-1.5 text-[11.5px] font-bold text-tx-hi hover:bg-ink-700"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => player.setExpanded(true)}
              className="rounded-full bg-ink-600 px-3 py-1.5 text-[11.5px] font-bold text-tx-hi hover:bg-ink-500"
            >
              Open
            </button>
          </div>
        </div>
      </div>

      {picking && (
        <TrackPicker
          title="Change the track"
          onClose={() => setPicking(false)}
          onPick={(track) => {
            setPicking(false);
            player.play(track); // Routed through the session by the controller.
          }}
        />
      )}
    </>
  );
}

function SyncBadge({
  status,
  drift,
}: {
  status: ReturnType<typeof useSession>["status"];
  drift: number;
}) {
  if (status === "synced") {
    return <StatusPill tone="synced">In sync</StatusPill>;
  }
  if (status === "catching-up") {
    return <StatusPill tone="pending">Catching up</StatusPill>;
  }
  if (status === "connecting") {
    return <StatusPill tone="neutral">Connecting</StatusPill>;
  }
  return (
    <StatusPill tone="lost">
      {Math.abs(drift) > 2000 ? "Out of sync" : "Reconnecting"}
    </StatusPill>
  );
}

function TrackPicker({
  title,
  onPick,
  onClose,
}: {
  title: string;
  onPick: (track: import("@/lib/music/types").Track) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/80 backdrop-blur-sm sm:items-center">
      <div
        className={cn(
          "flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden border border-ink-500 bg-ink-800",
          "rounded-t-[var(--r-xl)] sm:rounded-[var(--r-xl)]",
        )}
      >
        <div className="flex items-center gap-3 border-b border-ink-600 px-5 py-4">
          <h2 className="flex-1 text-[15px] font-bold text-tx-hi">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-tx-mid hover:bg-ink-700 hover:text-tx-hi"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {/* Picking here starts a session rather than playing solo, so the
              search's own play action is intercepted. */}
          <TrackSearch onPick={onPick} pickLabel="Play together" />
        </div>
      </div>
    </div>
  );
}
