"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Album art with a branded fallback.
 *
 * Provider artwork is unreliable — Internet Archive items frequently have
 * none, and its thumbnail service 404s often. A gradient tile keeps the layout
 * intact rather than leaving a broken-image hole in the player.
 *
 * Plain <img>: these are arbitrary third-party hosts, so next/image would need
 * every provider domain allow-listed and would bill optimisation for images we
 * show once.
 */
export function Artwork({
  src,
  alt,
  className,
  rounded = "rounded-[var(--r-md)]",
}: {
  src: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "relative shrink-0 overflow-hidden bg-[image:var(--together)]",
          rounded,
          className,
        )}
      >
        <span className="absolute inset-0 bg-[radial-gradient(60%_50%_at_24%_18%,rgba(255,255,255,0.42),transparent_60%),radial-gradient(45%_40%_at_82%_84%,rgba(10,4,26,0.5),transparent_62%)]" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-cover", rounded, className)}
    />
  );
}
