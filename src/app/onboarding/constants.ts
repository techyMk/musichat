/**
 * Shared by the server actions and the client forms.
 *
 * These cannot live in actions.ts: a "use server" module is only allowed to
 * export async functions, and a single non-function export silently strips
 * every export from the module.
 */

/** FR-P1. Mirrors the username_format check constraint in migration 0001. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const GENRES = [
  "Indie",
  "Lo-fi",
  "Hip-hop",
  "Classical",
  "Jazz",
  "Rock",
  "Electronic",
  "Folk",
  "R&B",
  "Ambient",
] as const;

export const MAX_GENRES = 10;
export const BIO_LIMIT = 150;
export const DISPLAY_NAME_LIMIT = 40;
