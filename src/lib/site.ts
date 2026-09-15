/**
 * The single source for the site's absolute base URL (ARCHITECTURE.md §9.1).
 *
 * There is a chicken-and-egg problem on a first deploy: you cannot set
 * NEXT_PUBLIC_SITE_URL to the deployed URL until the deploy exists. So the
 * variable is optional, and Vercel's own system variables fill the gap.
 *
 * Every value is validated. A blank, malformed, or scheme-less value falls
 * through to the next candidate rather than throwing at module load — an
 * exception here takes down the entire build, which is exactly what happened
 * the first time this shipped.
 */

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  // Vercel's system variables are bare hostnames, with no scheme.
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    return undefined;
  }
}

/**
 * These must be referenced as literals. Next.js substitutes NEXT_PUBLIC_*
 * at build time by matching the source text, so a computed lookup would
 * silently resolve to undefined in the browser bundle.
 */
export const siteUrl =
  normalize(process.env.NEXT_PUBLIC_SITE_URL) ??
  // Stable production domain — preferred, it does not change per deploy.
  normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalize(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ??
  // Per-deployment URL, so preview builds get correct absolute links.
  normalize(process.env.VERCEL_URL) ??
  normalize(process.env.NEXT_PUBLIC_VERCEL_URL) ??
  "http://localhost:3000";

/** Absolute URL for a path, for OG tags, invite links and the manifest. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl).toString();
}
