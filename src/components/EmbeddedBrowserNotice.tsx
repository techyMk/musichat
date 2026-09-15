"use client";

import { useSyncExternalStore } from "react";

/**
 * Links shared on WhatsApp and Instagram open inside their own embedded
 * browser, where Google sign-in is frequently blocked, sessions often do not
 * persist, and a PWA cannot be installed.
 *
 * For this screen that is not an edge case — it is the majority path, since
 * the whole point is that the link was shared in a messaging app. Miss this
 * and the primary growth loop fails for most people, with no error anywhere
 * to explain why.
 */
const EMBEDDED =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|Twitter|WhatsApp/i;

/** The user agent never changes, so there is nothing to subscribe to. */
const subscribe = () => () => {};

export function EmbeddedBrowserNotice() {
  // useSyncExternalStore rather than an effect: it reads the client value
  // during hydration and returns false on the server, with no state write.
  const embedded = useSyncExternalStore(
    subscribe,
    () => EMBEDDED.test(navigator.userAgent),
    () => false,
  );

  if (!embedded) return null;

  return (
    <div className="mb-5 rounded-[var(--r-sm)] border border-[rgba(255,194,75,0.28)] bg-[rgba(255,194,75,0.12)] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#FFDD9E]">
      You&apos;re in an in-app browser. Tap the <strong>⋯</strong> menu and
      choose <strong>Open in browser</strong> — signing in here often
      doesn&apos;t stick.
    </div>
  );
}
