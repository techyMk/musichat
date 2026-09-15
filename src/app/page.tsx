import Link from "next/link";

export default function Home() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16"
    >
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
        Milestone 0 · foundations
      </p>

      <h1 className="font-display mb-4 text-4xl leading-tight font-bold tracking-tight text-tx-hi">
        Even when you&apos;re apart,
        <br />
        listen together.
      </h1>

      <p className="mb-10 text-[15px] leading-relaxed text-tx-mid">
        The shell is deployed and the design tokens are live. Nothing else is
        built yet — the next thing to prove is that two devices can hold the
        same song.
      </p>

      <Link
        href="/spike"
        className="rounded-full bg-[image:var(--together)] py-3.5 text-center font-bold text-white"
      >
        Open the sync spike
      </Link>

      <p className="mt-4 text-center text-[13px] text-tx-lo">
        Throwaway code. Delete it once the question is answered.
      </p>
    </main>
  );
}
