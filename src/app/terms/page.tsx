import type { Metadata } from "next";
import { PublicPage, Section } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules for using MusiChat.",
  alternates: { canonical: "/terms" },
};

/**
 * Required before launch (QUALITY-CHECKLIST.md §3). Carries the Creative
 * Commons attribution terms (PRD §8.4) and the 13+ age floor (PRD A7).
 */
export default function TermsPage() {
  return (
    <PublicPage
      eyebrow="Terms"
      title="The rules"
      lede="Short and in plain language, because terms nobody reads protect nobody."
    >
      <Section heading="Who can use MusiChat">
        <p>
          You need to be at least 13 years old. If the law where you live sets a
          higher age for consenting to online services on your own, that age
          applies instead.
        </p>
        <p>One account per person. Don&apos;t impersonate anyone.</p>
      </Section>

      <Section heading="How to behave">
        <p>
          Don&apos;t use MusiChat to harass, threaten, or send anyone unwanted
          sexual content. Don&apos;t send anything illegal. Don&apos;t try to
          reach people who have blocked you, and don&apos;t automate account
          creation or message sending.
        </p>
        <p>
          Every conversation has block and report. We review reports and may
          suspend or remove accounts that break these rules.
        </p>
      </Section>

      <Section heading="The music">
        <p>
          Music on MusiChat comes from independent artists who publish under
          open licences, mostly Creative Commons. Those licences require credit,
          which is why every track shows its artist and licence in the player.
        </p>
        <p>
          You may listen to that music inside MusiChat. You may not redistribute
          it, sell it, or strip the attribution. Some licences also prohibit
          commercial use or remixing — the licence shown with each track is the
          one that governs it.
        </p>
        <p>
          You don&apos;t upload music, and there&apos;s no way to. If you are an
          artist and believe something here is yours and shouldn&apos;t be, get
          in touch and we&apos;ll remove it.
        </p>
      </Section>

      <Section heading="What you post">
        <p>
          Your messages and profile stay yours. You give us only the permission
          needed to run the service — storing your content and showing it to the
          people you send it to.
        </p>
      </Section>

      <Section heading="The boring necessary part">
        <p>
          MusiChat is provided as-is. Synchronised playback depends on networks
          and devices we don&apos;t control, so we can&apos;t promise it will
          always be perfect or always available. We&apos;re not liable for
          indirect losses arising from using it.
        </p>
        <p>
          You can stop using MusiChat and delete your account whenever you want.
          We may suspend accounts that break these terms.
        </p>
      </Section>

      <Section heading="Changes and contact">
        <p>
          If these terms change in a way that matters, we&apos;ll say so in the
          app rather than quietly editing this page. Questions:{" "}
          <strong className="text-tx-hi">[support email — to be added]</strong>.
        </p>
      </Section>
    </PublicPage>
  );
}
