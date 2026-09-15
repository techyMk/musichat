import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Lets a phone on the same wifi load dev resources from the laptop.
   * Without this, Next serves the HTML but refuses the JavaScript, so the
   * page renders and then sits there completely dead.
   *
   * Dev only — ignored entirely in production builds.
   * If your router hands the laptop a different IP, update this list.
   */
  allowedDevOrigins: ["192.168.1.6"],
};

export default nextConfig;
