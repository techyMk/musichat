"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Text input with label, hint and error. DESIGN.md §2 shape tokens.
 *
 * Errors explain what went wrong and never apologise, per the voice rules in
 * DESIGN.md §9. An error replaces the hint rather than stacking beneath it.
 */
type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  /** Rendered inside the control, before the input — e.g. "@" on username. */
  prefix?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

export function Field({
  label,
  hint,
  error,
  prefix,
  className,
  type = "text",
  ...rest
}: FieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[11px] font-bold text-tx-mid">
        {label}
      </label>

      <div
        className={cn(
          "flex items-center gap-1.5 rounded-[var(--r-md)] border bg-ink-700 px-3.5 py-3",
          "transition-colors duration-[var(--dur-fast)] ease-brand",
          "focus-within:border-you-500 focus-within:shadow-[0_0_0_3px_rgba(255,79,151,0.18)]",
          error ? "border-danger" : "border-ink-500",
        )}
      >
        {prefix && <span className="text-tx-lo select-none">{prefix}</span>}

        <input
          id={id}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-tx-hi outline-none placeholder:text-tx-lo"
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="shrink-0 text-[12px] font-bold text-tx-mid hover:text-tx-hi"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-[11.5px] font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11.5px] text-tx-lo">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
