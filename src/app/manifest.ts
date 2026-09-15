import type { MetadataRoute } from "next";

/**
 * PWA manifest. Installing to the home screen is not cosmetic here — on iOS
 * it is the precondition for web push, which is the MVP's largest functional
 * gap (PRD §9.4).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MusiChat — listen together, wherever you are",
    short_name: "MusiChat",
    description:
      "Chat and play the same song at the same moment, with the one person you'd text at 2am.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0C0A1A",
    theme_color: "#141128",
    categories: ["music", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android crops to circles and squircles; this one is padded so the
        // mark survives the crop.
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
