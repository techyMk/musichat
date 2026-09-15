"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function InviteActions({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = `Come vibe with me on MusiChat — we can listen to the same song at the same time.`;

    // The native sheet is the whole point on mobile: it opens WhatsApp,
    // Instagram and Messages without us integrating any of them.
    if (navigator.share) {
      try {
        await navigator.share({ title: "MusiChat", text, url: link });
        return;
      } catch {
        // Cancelled, or unavailable — fall through to copying.
      }
    }
    await copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some in-app browsers; the code is on screen
      // to be typed manually, which is why it is short and unambiguous.
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Button onClick={share} full>
        Share invite
      </Button>
      <Button onClick={copy} variant="ghost" full aria-live="polite">
        {copied ? "Link copied" : "Copy link"}
      </Button>

      <p className="mt-1 text-[11.5px] break-all text-tx-lo">{link}</p>
      <p className="sr-only">Your invite code is {code}</p>
    </div>
  );
}
