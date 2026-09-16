"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  blockUser,
  reportUser,
  type ActionState,
} from "@/app/(app)/safety/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const REASONS = [
  { value: "harassment", label: "Harassment or threats" },
  { value: "sexual", label: "Unwanted sexual content" },
  { value: "spam", label: "Spam" },
  { value: "copyright", label: "Music they don't have rights to" },
  { value: "other", label: "Something else" },
];

/**
 * Block and report, from the conversation header.
 *
 * Every conversation carries this — a private messaging product with no way to
 * stop someone is not safe, and the Terms promise both.
 */
export function SafetyMenu({
  targetId,
  targetName,
}: {
  targetId: string;
  targetName: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "report" | "block">("menu");
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

  const close = () => {
    setOpen(false);
    setMode("menu");
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Options for ${targetName}`}
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full text-tx-mid hover:bg-ink-700 hover:text-tx-hi"
      >
        <svg viewBox="0 0 20 20" width={16} height={16} aria-hidden="true">
          <circle cx="10" cy="4" r="1.6" fill="currentColor" />
          <circle cx="10" cy="10" r="1.6" fill="currentColor" />
          <circle cx="10" cy="16" r="1.6" fill="currentColor" />
        </svg>
      </button>

      {open && mode === "menu" && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-[var(--r-md)] border border-ink-500 bg-ink-700 py-1 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]"
        >
          <button
            type="button"
            onClick={() => setMode("report")}
            className="block w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-tx-hi hover:bg-ink-600"
          >
            Report {targetName}
          </button>
          <button
            type="button"
            onClick={() => setMode("block")}
            className="block w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-danger hover:bg-ink-600"
          >
            Block {targetName}
          </button>
        </div>
      )}

      {open && mode === "report" && (
        <ReportDialog
          targetId={targetId}
          targetName={targetName}
          onClose={close}
        />
      )}

      {open && mode === "block" && (
        <BlockDialog
          targetId={targetId}
          targetName={targetName}
          onCancel={() => setMode("menu")}
        />
      )}
    </div>
  );
}

function Dialog({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-5 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-[var(--r-xl)] border border-ink-500 bg-ink-800 p-6"
      >
        <h2 className="font-display mb-3 text-[20px] leading-tight font-bold tracking-tight text-tx-hi">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function ReportDialog({
  targetId,
  targetName,
  onClose,
}: {
  targetId: string;
  targetName: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    reportUser,
    {},
  );

  if (state.ok) {
    return (
      <Dialog title="Report sent">
        <p className="mb-5 text-[13.5px] leading-relaxed text-tx-mid">
          Thanks. We read every report. You won&apos;t hear back unless we need
          more from you.
        </p>
        <Button full onClick={onClose}>
          Done
        </Button>
      </Dialog>
    );
  }

  return (
    <Dialog title={`Report ${targetName}`}>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="target" value={targetId} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[12px] font-bold text-tx-mid">
            What&apos;s happening?
          </legend>
          {REASONS.map((r, i) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-2.5 text-[13px] text-tx-hi"
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                defaultChecked={i === 0}
                className="accent-[var(--you-500)]"
              />
              {r.label}
            </label>
          ))}
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-tx-mid">
            Anything else? (optional)
          </span>
          <textarea
            name="detail"
            rows={3}
            maxLength={1000}
            className="resize-none rounded-[var(--r-md)] border border-ink-500 bg-ink-700 px-3 py-2 text-[13px] text-tx-hi outline-none focus:border-you-500"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-tx-hi">
          <input
            type="checkbox"
            name="also_block"
            defaultChecked
            className="accent-[var(--you-500)]"
          />
          Also block {targetName}
        </label>

        {state.error && (
          <p role="alert" className="text-[12.5px] text-danger">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="ghost" full onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" full disabled={pending}>
            {pending ? "Sending…" : "Send report"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function BlockDialog({
  targetId,
  targetName,
  onCancel,
}: {
  targetId: string;
  targetName: string;
  onCancel: () => void;
}) {
  return (
    <Dialog title={`Block ${targetName}?`}>
      {/* Consequences in plain language — a confirmation nobody understands
          is not consent (UX.md §6.9). */}
      <ul className="mb-5 flex flex-col gap-2 text-[13.5px] leading-relaxed text-tx-mid">
        <li>They won&apos;t be able to message you or listen with you.</li>
        <li>Your conversation and any session end immediately.</li>
        <li>Neither of you will find the other by username.</li>
        <li>They aren&apos;t told.</li>
      </ul>

      <div className={cn("flex gap-2")}>
        <Button type="button" variant="ghost" full onClick={onCancel}>
          Cancel
        </Button>
        <form action={blockUser} className="flex-1">
          <input type="hidden" name="target" value={targetId} />
          <Button type="submit" variant="danger" full>
            Block
          </Button>
        </form>
      </div>
    </Dialog>
  );
}
