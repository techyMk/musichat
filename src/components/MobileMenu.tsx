"use client";

import { useEffect, useState } from "react";
import { AppNav, LegalLinks } from "@/components/AppNav";
import { Avatar } from "@/components/ui/Avatar";
import { MenuIcon, CloseIcon } from "@/components/icons";

/**
 * Phone navigation. A drawer rather than a bottom tab bar, because the bottom
 * edge belongs to the mini player (UX.md §3.1, §4).
 */
export function MobileMenu({
  name,
  username,
  avatarUrl,
  pendingCount,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
  pendingCount: number;
}) {
  const [open, setOpen] = useState(false);

  // A drawer that survives a back gesture, and a page that cannot scroll
  // behind it.
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          pendingCount > 0
            ? `Menu — ${pendingCount} friend request waiting`
            : "Menu"
        }
        aria-expanded={open}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-700 text-tx-mid transition-colors duration-[var(--dur-fast)] hover:text-tx-hi"
      >
        <MenuIcon className="h-[18px] w-[18px]" />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-you-500 px-1 text-[9.5px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col border-r border-ink-600 bg-ink-800 p-4 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
          >
            <div className="mb-6 flex items-center gap-3">
              <Avatar name={name} src={avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-tx-hi">
                  {name}
                </p>
                <p className="truncate text-[12px] text-tx-lo">@{username}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-tx-mid hover:bg-ink-700 hover:text-tx-hi"
              >
                <CloseIcon className="h-[18px] w-[18px]" />
              </button>
            </div>

            <AppNav pendingCount={pendingCount} onNavigate={close} />

            <div className="mt-auto border-t border-ink-600 pt-4">
              <LegalLinks onNavigate={close} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
