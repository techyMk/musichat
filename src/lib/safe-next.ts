/**
 * Validates a `?next=` redirect target.
 *
 * Without this, `/login?next=https://evil.example` would send a freshly
 * signed-in user straight to an attacker's page, wearing our branding as
 * credibility. Only same-origin absolute paths are allowed.
 *
 * `//evil.example` is rejected too: browsers read a leading double slash as
 * a protocol-relative URL, so it escapes the origin despite starting with "/".
 */
export function safeNext(value: string | null | undefined, fallback = "/chats") {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  // Backslashes are normalised to forward slashes by some browsers.
  if (value.includes("\\")) return fallback;
  return value;
}
