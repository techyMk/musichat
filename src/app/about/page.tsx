import type { Metadata } from "next";
import { PublicPage, Section } from "@/components/PublicPage";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why MusiChat exists, how synchronised listening works, and where the music comes from.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PublicPage
      eyebrow="About"
      title="Built for one person at a time"
      lede="Most apps are designed to connect you to everyone. MusiChat is designed to connect you to one person, properly."
    >
      <Section heading="The idea">
        <p>
          Distance is mostly made of small absences. Not being able to say
          &ldquo;listen to this&rdquo; and have someone actually hear it, right
          then, with you. Sending a link and waiting isn&apos;t the same thing.
        </p>
        <p>
          So MusiChat plays the same song on both phones at the same moment,
          inside a conversation. You talk over it, either of you can change it,
          and it stays together.
        </p>
      </Section>

      <Section heading="How the sync works">
        <p>
          Two phones disagree about what time it is — often by seconds,
          sometimes by much more. Before anything can be synchronised, each
          device measures how far its own clock sits from the server&apos;s.
        </p>
        <p>
          After that, the position of a song is never sent as a ticking number.
          The server stores an anchor — where the song was, and exactly when
          that was true — and each device works out where it should be now. That
          is why someone can lose signal in a tunnel for a minute and rejoin at
          the right place instead of where they left.
        </p>
        <p>
          Small drift is corrected by nudging playback speed by two percent,
          which is inaudible. Only large gaps get a jump. The target is a
          quarter of a second, which is comfortably inside what people perceive
          as &ldquo;together&rdquo;.
        </p>
      </Section>

      <Section heading="Where the music comes from">
        <p>
          MusiChat plays music from independent artists who license their work
          for free distribution. That is a deliberate choice, and an honest
          limitation: streaming commercial catalogues legally requires licensing
          deals worth six figures before a single song plays.
        </p>
        <p>
          The upside is that it costs nothing, needs no Spotify or Apple Music
          subscription on either side, and works the same on every phone. The
          trade is that you won&apos;t find this week&apos;s chart. You will
          find things neither of you has heard — which turns out to be a better
          thing to discover together than something you both already know.
        </p>
        <p>Every track credits its artist and licence in the player.</p>
      </Section>

      <Section heading="What we don't do">
        <p>
          There is no feed, no follower count, no discovery of strangers. You
          find people by exact username or by an invite link they gave you, and
          nothing else. We never collect or infer location.
        </p>
        <p>
          Conversations are private between two people. They are not indexed,
          not analysed, and not used to train anything.
        </p>
      </Section>

      <div className="flex flex-col gap-2.5 rounded-[var(--r-lg)] border border-ink-600 bg-ink-800/60 p-5 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-[14px] font-bold text-tx-hi">
          Try it with one person.
        </p>
        <ButtonLink href="/signup" className="sm:px-7">
          Create an account
        </ButtonLink>
      </div>
    </PublicPage>
  );
}
