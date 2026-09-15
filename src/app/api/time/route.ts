/**
 * The authoritative clock. Both devices measure their offset from this one
 * endpoint, which is what lets them agree on where a song should be.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { now: Date.now() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
