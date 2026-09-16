import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * QUALITY-CHECKLIST.md §0 and §4.
 *
 * AI crawlers are deliberately allowed on the public pages — blocking them
 * removes the product from AI-assisted discovery for no benefit. What is
 * disallowed is disallowed for everyone: indexing a private chat app is a
 * privacy incident, not an SEO win.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/chats",
          "/chats/",
          "/dashboard",
          "/me",
          "/friends/",
          "/music",
          "/subscription",
          "/onboarding/",
          "/invite/",
          "/auth/",
          "/api/",
          "/reset",
          "/verify",
          "/spike",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
