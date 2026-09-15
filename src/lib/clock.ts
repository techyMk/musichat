/**
 * NTP-style clock offset (ARCHITECTURE.md §6.1).
 *
 * Two phones disagree about what time it is, often by seconds. Before anything
 * can be synchronised, each device has to learn how far its own clock sits from
 * the server's.
 */

export type ClockSample = { rtt: number; offset: number };

export type Clock = {
  /** Add this to Date.now() to get server time. */
  offset: number;
  /** Round trip of the best sample — our latency estimate. */
  rtt: number;
  samples: number;
};

async function takeSample(): Promise<ClockSample> {
  const t0 = Date.now();
  const res = await fetch("/api/time", { cache: "no-store" });
  const t1 = Date.now();
  const { now: serverTime } = (await res.json()) as { now: number };

  return {
    rtt: t1 - t0,
    // Assume the request and the response each took half the round trip.
    offset: serverTime - (t0 + t1) / 2,
  };
}

/**
 * Takes five readings and keeps the two fastest. A single delayed packet
 * otherwise poisons the estimate, and slow samples are always the wrong ones —
 * latency can only ever add delay, never remove it.
 */
export async function measureClock(sampleCount = 5): Promise<Clock> {
  const samples: ClockSample[] = [];

  for (let i = 0; i < sampleCount; i++) {
    samples.push(await takeSample());
  }

  samples.sort((a, b) => a.rtt - b.rtt);
  const best = samples.slice(0, 2);
  const offset = best.reduce((sum, s) => sum + s.offset, 0) / best.length;

  return { offset, rtt: best[0].rtt, samples: sampleCount };
}
