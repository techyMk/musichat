"use client";

/** Transport icons. Sized by the caller. */

export function PlayPauseIcon({
  playing,
  loading,
  size = 18,
}: {
  playing: boolean;
  loading?: boolean;
  size?: number;
}) {
  if (loading) {
    return (
      <svg
        viewBox="0 0 20 20"
        width={size}
        height={size}
        aria-hidden="true"
        className="motion-safe:animate-spin"
      >
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="30 14"
          opacity="0.9"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      {playing ? (
        <path d="M6.5 4h2.2v12H6.5zM11.3 4h2.2v12h-2.2z" fill="currentColor" />
      ) : (
        <path d="M6.5 3.9 16 10l-9.5 6.1z" fill="currentColor" />
      )}
    </svg>
  );
}

export function SkipIcon({
  direction,
  size = 18,
}: {
  direction: "back" | "forward";
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      style={
        direction === "back" ? { transform: "scaleX(-1)" } : undefined
      }
    >
      <path d="M4 4.5 12 10l-8 5.5z" fill="currentColor" />
      <rect x="13.4" y="4.5" width="2.2" height="11" rx="1" fill="currentColor" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}
