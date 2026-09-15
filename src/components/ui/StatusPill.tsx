import { cn } from "@/lib/cn";

/**
 * Connection and session status. DESIGN.md §5.5.
 *
 * This component is load-bearing: it must never claim "In sync" before that
 * has been measured true. One lie and users stop believing the indicator
 * permanently — and the indicator is the only evidence they have that the
 * other person is really hearing the same thing.
 */
export type StatusTone = "synced" | "pending" | "lost" | "neutral";

const TONES: Record<StatusTone, { dot: string; text: string; border: string }> = {
  synced: { dot: "bg-online", text: "text-tx-mid", border: "border-ink-500" },
  pending: {
    dot: "bg-warn motion-safe:animate-pulse",
    text: "text-warn",
    border: "border-[rgba(255,194,75,0.32)]",
  },
  lost: {
    dot: "bg-danger",
    text: "text-danger",
    border: "border-[rgba(249,69,69,0.32)]",
  },
  neutral: { dot: "bg-tx-lo", text: "text-tx-lo", border: "border-ink-500" },
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-ink-700 px-3 py-1",
        "text-[10.5px] font-bold",
        t.border,
        t.text,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("block h-1.5 w-1.5 rounded-full", t.dot)} />
      {children}
    </span>
  );
}
