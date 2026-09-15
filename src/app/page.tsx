import { ButtonLink } from "@/components/ui/Button";

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
        The shell is deployed, the design tokens are live, and two devices have
        been proven to hold the same song. Accounts come next.
      </p>

      <div className="flex flex-col gap-2.5">
        <ButtonLink href="/spike" full>
          Open the sync spike
        </ButtonLink>
        <p className="text-center text-[13px] text-tx-lo">
          Test harness. It goes away when the real player ships.
        </p>
      </div>
    </main>
  );
}
