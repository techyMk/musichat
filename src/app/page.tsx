import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";
import { PublicFooter } from "@/components/PublicPage";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SectionHeading, Card, Faq, PlanCard } from "@/components/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "Chat and play the same song at the same moment, with the one person you'd text at 2am. Free, no subscription, works on any phone.",
};

const FEATURES = [
  {
    title: "The same song, the same second",
    body: "Both phones stay within about a quarter of a second of each other, which is comfortably inside what anyone can perceive as together.",
  },
  {
    title: "Talk over it",
    body: "Messages sit alongside the music instead of in a different app. React to the bit you both just heard, while you're both still hearing it.",
  },
  {
    title: "The music follows you",
    body: "Open another conversation, check your profile, put the phone down. A session belongs to the friendship, not to the screen you're looking at.",
  },
  {
    title: "Works when they're asleep",
    body: "Start listening before the other person is even online. When they open the app, they join wherever the song has got to.",
  },
  {
    title: "Nobody can find you",
    body: "No feed, no follower counts, no suggested strangers. People reach you by exact username or an invite you sent them. Location is never collected.",
  },
  {
    title: "Nothing to subscribe to",
    body: "No Spotify or Apple Music account needed, on either side. That's the whole point — it should work with whoever you want, not whoever pays for the same app.",
  },
];

const STEPS = [
  {
    title: "Invite one person",
    body: "Generate a code or link and send it however you already talk. They tap it and land straight in a chat with you.",
  },
  {
    title: "Put something on",
    body: "Start a song from inside the conversation. They hear it too, wherever they are.",
  },
  {
    title: "Keep talking",
    body: "Either of you can skip, pause or seek. It stays together either way.",
  },
];

const AUDIENCE = [
  {
    title: "Long-distance couples",
    body: "Different cities, different time zones, the same record at the end of the day. This is who the app was designed around.",
  },
  {
    title: "Close friends",
    body: "The person you already send songs to. Except now you hear their reaction while it's playing, not three hours later.",
  },
  {
    title: "Family apart",
    body: "Siblings at university, a parent working abroad. Something to do together that isn't another video call.",
  },
];

const FAQS = [
  {
    q: "Is it actually free?",
    a: "Yes, and free for both people. There's no paid tier at the moment, no ads, and no trial that expires. If that ever changes, synchronised listening with one person stays free.",
  },
  {
    q: "Do I need Spotify or Apple Music?",
    a: "No, and neither does the person you're listening with. That's deliberate — needing both people to pay for the same service is the reason most shared-listening features go unused.",
  },
  {
    q: "What music can I play?",
    a: "Music from independent artists who license their work for free distribution. You won't find this week's chart. You will find things neither of you has heard, which is arguably a better thing to discover together.",
  },
  {
    q: "Can strangers find me?",
    a: "No. There's no directory, no suggestions, and no nearby-people feature. Someone needs your exact username or an invite link you personally sent them.",
  },
  {
    q: "What if my partner loses signal?",
    a: "The music keeps playing for you, and the app shows that they've dropped. When they reconnect they rejoin at the live position, not where they left off.",
  },
  {
    q: "Is it an app or a website?",
    a: "A website you can install to your home screen, so it behaves like an app without an App Store download. Native apps are planned, mainly for better notifications.",
  },
];

export default async function Home() {
  // The home page stays reachable when signed in — it is the public face of
  // the product, and bouncing people straight to the app means they can never
  // look at it again. The calls to action change instead of the page.
  const user = await getUser();

  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6 sm:px-8">
      {/* Top bar */}
      <header className="flex items-center gap-4 py-5">
        <Wordmark href="/" size="md" className="flex-1" />
        <nav className="hidden items-center gap-6 text-[13.5px] text-tx-mid sm:flex">
          <a href="#how" className="hover:text-tx-hi">
            How it works
          </a>
          <a href="#pricing" className="hover:text-tx-hi">
            Pricing
          </a>
          <Link href="/about" className="hover:text-tx-hi">
            About
          </Link>
        </nav>
        <ThemeToggle />
        <Link
          href={user ? "/dashboard" : "/login"}
          className="text-[13.5px] font-bold text-tx-hi hover:underline"
        >
          {user ? "Open app" : "Sign in"}
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center gap-10 pt-8 pb-4 text-center lg:flex-row lg:items-center lg:gap-16 lg:pt-16 lg:text-left">
        <div className="lg:order-2 lg:shrink-0">
          <Image
            src="/brand/icon-transparent.png"
            alt=""
            width={240}
            height={240}
            priority
            className="h-28 w-28 sm:h-36 sm:w-36 lg:h-56 lg:w-56"
          />
        </div>

        <div className="flex w-full flex-col items-center lg:order-1 lg:items-start">
          <h1 className="font-display mb-3 text-[32px] leading-[1.1] font-bold tracking-tight text-balance text-tx-hi sm:text-[40px] lg:text-[54px]">
            Even when you&apos;re apart, listen together.
          </h1>

          <p className="mb-7 max-w-[46ch] text-[14.5px] leading-relaxed text-balance text-tx-mid sm:text-[16px] lg:text-[17px]">
            Chat and play the same song at the same moment, with the one person
            you&apos;d text at 2am.
          </p>

          <div className="flex w-full max-w-sm flex-col gap-2.5 sm:flex-row lg:max-w-none">
            {user ? (
              <>
                <ButtonLink href="/dashboard" full className="sm:w-auto sm:px-8">
                  Go to your dashboard
                </ButtonLink>
                <ButtonLink
                  href="/friends/add"
                  variant="ghost"
                  full
                  className="sm:w-auto sm:px-8"
                >
                  Invite someone
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/signup" full className="sm:w-auto sm:px-8">
                  Create an account
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  variant="ghost"
                  full
                  className="sm:w-auto sm:px-8"
                >
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>

          <p className="mt-4 text-[12px] text-tx-lo">
            Free for both people. No subscription, no ads.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="pt-20 lg:pt-28">
        <SectionHeading
          eyebrow="What it is"
          title="A room for two, with a record player in it"
          lede="Not a messenger with a music tab, and not a music app with a comment box. The session is the point, and the conversation happens inside it."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} title={f.title}>
              {f.body}
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-8 pt-20 lg:pt-28">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, about a minute"
        />
        <ol className="grid gap-5 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3.5 sm:flex-col sm:gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[image:var(--together)] text-[12px] font-bold text-white"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="mb-1 text-[14.5px] font-bold text-tx-hi">
                  {step.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-tx-mid">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Who it's for */}
      <section className="pt-20 lg:pt-28">
        <SectionHeading
          eyebrow="Who it's for"
          title="Two people who'd rather be in the same room"
          lede="MusiChat is deliberately built for one relationship at a time. Group listening is a different product, and plenty of apps already do it badly."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {AUDIENCE.map((a) => (
            <Card key={a.title} title={a.title}>
              {a.body}
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-8 pt-20 lg:pt-28">
        <SectionHeading
          eyebrow="Pricing"
          title="Free, and free for the person you invite"
          lede="Shared listening only works if both sides can actually use it. Charging either of you to hear the same song would defeat the point."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            featured
            name="Free"
            price="₹0"
            summary="Everything MusiChat does today, for both people in a conversation."
            features={[
              "Synchronised listening with one person at a time",
              "Unlimited messages and conversations",
              "Full catalogue of independently licensed music",
              "No ads, ever",
            ]}
            cta={{ label: "Create an account", href: "/signup" }}
          />
          <PlanCard
            unavailable
            name="Plus"
            price="Later"
            summary="If a paid tier ever arrives, it will be for extras — not for the thing the app is named after."
            features={[
              "Shared playlists and a collaborative queue",
              "Listening history and anniversaries",
              "Group sessions beyond two people",
              "Synchronised listening stays free regardless",
            ]}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="pt-20 lg:pt-28">
        <SectionHeading eyebrow="Questions" title="The ones worth asking" />
        <Faq items={FAQS} />
      </section>

      {/* Closing CTA */}
      <section className="pt-20 lg:pt-28">
        <div className="flex flex-col items-center gap-5 rounded-[var(--r-xl)] border border-ink-600 bg-ink-800/70 p-8 text-center backdrop-blur-sm sm:p-12">
          <h2 className="font-display max-w-[22ch] text-[26px] leading-tight font-bold tracking-tight text-balance text-tx-hi sm:text-[32px]">
            It takes one person to start.
          </h2>
          <p className="max-w-[44ch] text-[14px] leading-relaxed text-balance text-tx-mid">
            Make an account, send one invite, put something on. They&apos;ll
            hear it wherever they are.
          </p>
          <ButtonLink href={user ? "/friends/add" : "/signup"} className="px-10">
            {user ? "Invite someone" : "Create an account"}
          </ButtonLink>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
