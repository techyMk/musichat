"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserSettings } from "@/lib/settings";
import { cn } from "@/lib/cn";

const TOGGLES = [
  {
    key: "showPresence",
    label: "Show when I'm online",
    detail:
      "Off means you're genuinely invisible, not just hidden — your device stops announcing itself at all.",
  },
  {
    key: "showVibing",
    label: "Show what I'm listening to",
    detail:
      "The vibing indicator on your friends' chat list, and the 'listening now' line on your invite page.",
  },
  {
    key: "readReceipts",
    label: "Read receipts",
    detail:
      "Reciprocal — turn this off and you stop seeing theirs too. Unread counts still work.",
  },
] as const;

export function SettingsForm({ initial }: { initial: UserSettings }) {
  const router = useRouter();
  const [client] = useState(() => createClient());
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(next: UserSettings) {
    setSettings(next);
    setError(null);

    const { error: rpcError } = await client.rpc("save_settings", {
      p_show_presence: next.showPresence,
      p_show_vibing: next.showVibing,
      p_read_receipts: next.readReceipts,
      p_request_policy: next.requestPolicy,
    });

    if (rpcError) {
      // Put it back rather than leaving the UI claiming something untrue.
      setSettings(settings);
      setError("Couldn't save that. Try again in a moment.");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      {TOGGLES.map((t) => (
        <label
          key={t.key}
          className="flex cursor-pointer items-start gap-3 rounded-[var(--r-md)] px-1 py-3.5 hover:bg-ink-700/50"
        >
          <input
            type="checkbox"
            checked={settings[t.key]}
            onChange={(e) =>
              void persist({ ...settings, [t.key]: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--you-500)]"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-tx-hi">
              {t.label}
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-relaxed text-tx-mid">
              {t.detail}
            </span>
          </span>
        </label>
      ))}

      <fieldset className="mt-5 border-t border-ink-600 pt-5">
        <legend className="sr-only">Who can add you</legend>
        <p className="mb-1 text-[14px] font-semibold text-tx-hi">
          Who can add you
        </p>
        <p className="mb-3 text-[12.5px] leading-relaxed text-tx-mid">
          There is no directory either way — nobody can browse for you.
        </p>

        <div className="flex flex-col gap-1.5">
          {[
            {
              value: "anyone" as const,
              label: "Anyone with my exact username",
            },
            {
              value: "link_only" as const,
              label: "Only people I send an invite link to",
            },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[var(--r-md)] border px-3.5 py-3",
                settings.requestPolicy === option.value
                  ? "border-you-500 bg-[rgba(255,79,151,0.08)]"
                  : "border-ink-600 hover:bg-ink-700/50",
              )}
            >
              <input
                type="radio"
                name="request_policy"
                checked={settings.requestPolicy === option.value}
                onChange={() =>
                  void persist({ ...settings, requestPolicy: option.value })
                }
                className="accent-[var(--you-500)]"
              />
              <span className="text-[13.5px] text-tx-hi">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-4 min-h-[18px]">
        {error ? (
          <p className="text-[12.5px] text-danger">{error}</p>
        ) : saved ? (
          <p className="text-[12.5px] font-semibold text-online">Saved</p>
        ) : null}
      </div>
    </div>
  );
}
