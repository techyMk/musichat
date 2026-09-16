"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Emoji picker.
 *
 * Hand-rolled rather than pulled from a library: the popular pickers ship
 * 200–800 KB of data, which would blow the 250 KB initial-bundle budget
 * (PRD §9.2) for a feature used a few characters at a time. A curated set
 * covers the overwhelming majority of chat use, and every device already has
 * a full system picker for the rest.
 */
const GROUPS: { label: string; emoji: string[] }[] = [
  {
    label: "Reactions",
    emoji: "😂 🥹 🥰 😍 😭 🤣 😅 😊 🙃 😉 😌 😔 😴 🤔 🙄 😤 😳 🥺 😬 😎 🤗 😇".split(" "),
  },
  {
    label: "Hearts",
    emoji: "❤️ 🩷 🧡 💛 💚 💙 💜 🖤 🤍 💔 💖 💘 💝 💕 💞 ✨".split(" "),
  },
  {
    label: "Music",
    emoji: "🎵 🎶 🎧 🎤 🎸 🎹 🥁 🎺 🎻 📻 🔊 💃 🕺 🪩 🔥 🌙".split(" "),
  },
  {
    label: "Gestures",
    emoji: "👍 👎 👏 🙏 🤝 ✌️ 🤞 🫶 🙌 💪 👋 🤙 👌 🫂 💯 ⭐".split(" "),
  },
];

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
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

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Add an emoji"
        aria-expanded={open}
        className="grid h-[42px] w-[42px] place-items-center rounded-full text-tx-mid transition-colors duration-[var(--dur-fast)] hover:bg-ink-700 hover:text-tx-hi"
      >
        <svg
          viewBox="0 0 20 20"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="7.2" />
          <circle cx="7.5" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="12.5" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
          <path d="M6.9 12.1a4 4 0 0 0 6.2 0" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Emoji"
          className="absolute bottom-full left-0 z-30 mb-2 max-h-[280px] w-[290px] overflow-y-auto rounded-[var(--r-lg)] border border-ink-500 bg-ink-700 p-3 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]"
        >
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[10px] font-bold tracking-[0.12em] text-tx-lo uppercase">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emoji.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      onPick(e);
                      setOpen(false);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-[var(--r-sm)] text-[18px] leading-none hover:bg-ink-600"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
