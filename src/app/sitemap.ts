import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Public pages only. User and invite URLs are never enumerated — a sitemap
 * listing invite codes would publish exactly what makes them private.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now, priority: 1 },
    { url: absoluteUrl("/about"), lastModified: now, priority: 0.8 },
    { url: absoluteUrl("/signup"), lastModified: now, priority: 0.7 },
    { url: absoluteUrl("/login"), lastModified: now, priority: 0.5 },
    { url: absoluteUrl("/privacy"), lastModified: now, priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, priority: 0.3 },
  ];
}
