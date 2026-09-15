/** Minimal line icons, sized by the parent's font-size via `em`. */

type Props = { className?: string };

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ChatIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M17 12a2 2 0 0 1-2 2H7l-4 3V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

export function AddPersonIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="7" r="3" />
      <path d="M2.5 16.5a5.5 5.5 0 0 1 11 0M15.5 6.5v4M17.5 8.5h-4" />
    </svg>
  );
}

export function PersonIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M4 16.8a6 6 0 0 1 12 0" />
    </svg>
  );
}

export function MenuIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
    </svg>
  );
}

export function CloseIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}
