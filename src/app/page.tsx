import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "Chat and play the same song at the same moment, with the one person you'd text at 2am. Free, no subscription, works on any phone.",
};

const STEPS = [
  {
    title: "Invite one person",
    body: "Generate a code or a link in the app and send it however you already talk. They tap it and land straight in a chat with you.",
  },
  {
    title: "Put something on",
    body: "Start a song from inside the conversation. They hear it too, within a fraction of a second, wherever they are.",
  },
  {
    title: "Keep talking",
    body: "The music follows you around the app. Either of you can skip, pause or seek — it stays together either way.",
  },
];

export default async function Home() {
  // Signed-in visitors have no use for the pitch.
  if (await getUser()) redirect("/chats");

  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6 pt-12 pb-20 sm:px-8 lg:pt-20">
      {/* Hero — stacked on phones, side by side once there is room */}
      <section className="flex flex-col items-center gap-10 text-center lg:flex-row lg:items-center lg:gap-16 lg:text-left">
        <div className="lg:order-2 lg:shrink-0">
          <Image
            src="/brand/icon-transparent.png"
            alt=""
            width={240}
            height={240}
            priority
            className="h-24 w-24 sm:h-32 sm:w-32 lg:h-60 lg:w-60"
          />
        </div>

        <div className="flex w-full flex-col items-center lg:order-1 lg:items-start">
          <h1 className="font-display mb-3 text-[30px] leading-[1.12] font-bold tracking-tight text-balance text-tx-hi sm:text-[38px] lg:text-[52px]">
            Even when you&apos;re apart, listen together.
          </h1>

          <p className="mb-7 max-w-[46ch] text-[14px] leading-relaxed text-balance text-tx-mid sm:text-[16px] lg:text-[17px]">
            Chat and play the same song at the same moment, with the one person
            you&apos;d text at 2am.
          </p>

          <div className="flex w-full max-w-sm flex-col gap-2.5 sm:flex-row lg:max-w-none">
            <ButtonLink href="/signup" full className="sm:w-auto sm:px-8">
              Create an account
            </ButtonLink>
            <ButtonLink href="/login" variant="ghost" full className="sm:w-auto sm:px-8">
              I already have one
            </ButtonLink>
          </div>

          <p className="mt-4 text-[12px] text-tx-lo">
            Free. No subscription, on either side.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20 lg:mt-28">
        <h2 className="mb-6 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
          How it works
        </h2>

        <ol className="grid gap-5 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3.5 sm:flex-col sm:gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[image:var(--together)] text-[11px] font-bold text-white"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="mb-1 text-[14px] font-bold text-tx-hi sm:text-[15px]">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-tx-mid sm:text-[13.5px]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 grid gap-5 lg:mt-24 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-[var(--r-lg)] border border-ink-600 bg-ink-800/60 p-5 backdrop-blur-sm sm:p-6">
          <h2 className="font-display mb-2 text-[19px] leading-tight font-bold tracking-tight text-tx-hi sm:text-[21px]">
            Not a messenger with a player bolted on
          </h2>
          <p className="text-[13px] leading-relaxed text-tx-mid sm:text-[13.5px]">
            A session belongs to the friendship, not to a screen. Open another
            chat and the music keeps going. Your partner drops off the network
            and it waits, then catches them up when they&apos;re back. Start
            listening before they&apos;re even online — they&apos;ll join
            wherever the song has got to.
          </p>
        </div>

        <div className="rounded-[var(--r-lg)] border border-ink-600 bg-ink-800/60 p-5 backdrop-blur-sm sm:p-6">
          <h2 className="font-display mb-2 text-[19px] leading-tight font-bold tracking-tight text-tx-hi sm:text-[21px]">
            About the music
          </h2>
          <p className="text-[13px] leading-relaxed text-tx-mid sm:text-[13.5px]">
            MusiChat plays music from independent artists who license it freely,
            which is why it costs nothing and needs no Spotify account. You
            won&apos;t find this week&apos;s chart here. You will find things
            neither of you has heard before — which, it turns out, is a better
            thing to discover together.
          </p>
        </div>
      </section>

      <footer className="mt-20 border-t border-ink-600 pt-6 text-center">
        <p className="text-[12px] text-tx-lo">Built for two people at a time.</p>
      </footer>
    </main>
  );
}
