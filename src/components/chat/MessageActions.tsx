"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Per-message menu: reply, and for your own messages edit and delete.
 *
 * Revealed on hover and on keyboard focus, so it is reachable without a
 * pointer — a hover-only affordance is invisible to keyboard and screen
 * reader users.
 */
export function MessageActions({
  mine,
  canEdit,
  onReply,
  onEdit,
  onDelete,
  align,
}: {
  mine: boolean;
  canEdit: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  align: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { label: "Reply", action: onReply, show: true, danger: false },
    { label: "Edit", action: onEdit, show: mine && canEdit, danger: false },
    { label: "Delete", action: onDelete, show: mine, danger: true },
  ].filter((i) => i.show);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Message actions"
        aria-expanded={open}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-full text-tx-lo",
          "opacity-0 transition-opacity duration-[var(--dur-fast)]",
          "group-hover:opacity-100 focus-visible:opacity-100",
          open && "opacity-100",
          "hover:bg-ink-700 hover:text-tx-hi",
        )}
      >
        <svg viewBox="0 0 20 20" width={15} height={15} aria-hidden="true">
          <circle cx="4" cy="10" r="1.5" fill="currentColor" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <circle cx="16" cy="10" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full z-20 mb-1 min-w-[132px] overflow-hidden rounded-[var(--r-md)]",
            "border border-ink-500 bg-ink-700 py-1 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                item.action();
              }}
              className={cn(
                "block w-full px-3.5 py-2 text-left text-[13px] font-semibold",
                "transition-colors duration-[var(--dur-fast)] hover:bg-ink-600",
                item.danger ? "text-danger" : "text-tx-hi",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
