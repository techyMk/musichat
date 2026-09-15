"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/**
 * Theme switch.
 *
 * Dark is the default and the designed-for case. Light exists because the app
 * gets used in daylight, and is a separate design rather than an inversion
 * (globals.css).
 *
 * The chosen theme is written to <html data-theme> and to localStorage, and
 * re-applied by an inline script before first paint — see THEME_SCRIPT below.
 * Without that, every load would flash dark before switching.
 */
export type Theme = "dark" | "light";

const KEY = "musichat-theme";

/** Inlined in the document head so it runs before anything renders. */
export const THEME_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem(${JSON.stringify(KEY)});
    if (t !== "light" && t !== "dark") {
      t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private mode and some in-app browsers block storage. The theme still
    // applies for this page view; it just will not be remembered.
  }
  listeners.forEach((cb) => cb());
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(
    subscribe,
    getTheme,
    // Matches the server render, which has no data-theme attribute yet.
    () => "dark" as Theme,
  );

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-tx-mid",
        "transition-colors duration-[var(--dur-fast)] hover:bg-ink-700 hover:text-tx-hi",
        className,
      )}
    >
      {theme === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      <path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 2v1.8M10 16.2V18M18 10h-1.8M3.8 10H2M15.7 4.3l-1.3 1.3M5.6 14.4l-1.3 1.3M15.7 15.7l-1.3-1.3M5.6 5.6 4.3 4.3" />
    </svg>
  );
}
