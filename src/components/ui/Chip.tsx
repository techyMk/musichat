"use client";

import { cn } from "@/lib/cn";

/** Selectable tag — music genres in profile setup, filters later. */
export function Chip({
  selected = false,
  className,
  children,
  ...rest
}: {
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3.5 py-2 text-[12px]",
        "transition-colors duration-[var(--dur-fast)] ease-brand",
        selected
          ? "border-you-500 bg-[rgba(255,79,151,0.18)] font-bold text-you-300"
          : "border-ink-500 text-tx-mid hover:border-tx-lo hover:text-tx-hi",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
