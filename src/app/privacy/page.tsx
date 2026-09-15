import type { Metadata } from "next";
import { PublicPage, Section } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What MusiChat collects, what it does not, and how to get your data or delete your account.",
  alternates: { canonical: "/privacy" },
};

/**
 * Required before launch (QUALITY-CHECKLIST.md §3). Written to be read rather
 * than to be legally impenetrable — and it states plainly that messages are
 * not end-to-end encrypted, because claiming otherwise would be worse than
 * not offering it (PRD assumption A4).
 *
 * TODO before public launch: replace the contact placeholders with a real
 * support address and a registered postal address. The DPDP Act requires a
 * named grievance contact.
 */
export default function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Privacy"
      title="What we know about you"
      lede="Short version: an email address, whatever you put on your profile, who you've connected with, and your messages. No location, ever."
    >
      <Section heading="What we collect">
        <p>
          <strong className="text-tx-hi">Your email address</strong>, to sign you
          in and to send confirmation and password-reset links.
        </p>
        <p>
          <strong className="text-tx-hi">Your profile</strong> — username, and
          optionally a display name, photo, short bio and music genres.
          Everything except the username is optional and can be left blank.
        </p>
        <p>
          <strong className="text-tx-hi">Your connections</strong> — who you are
          friends with, and who has sent you a request.
        </p>
        <p>
          <strong className="text-tx-hi">Your messages and listening
          sessions</strong>, so they are there when you come back.
        </p>
      </Section>

      <Section heading="What we never collect">
        <p>
          <strong className="text-tx-hi">Location.</strong> Not collected, not
          stored, not inferred. There is no nearby-people feature and there will
          not be one.
        </p>
        <p>
          <strong className="text-tx-hi">Your contacts.</strong> We never ask for
          your address book.
        </p>
        <p>
          <strong className="text-tx-hi">Advertising or cross-site tracking
          cookies.</strong> MusiChat sets one cookie, for keeping you signed in.
          Our analytics are cookieless and count page visits, not people.
        </p>
      </Section>

      <Section heading="About message encryption">
        <p>
          Messages are encrypted in transit and encrypted at rest on our
          database. They are{" "}
          <strong className="text-tx-hi">not end-to-end encrypted</strong>, which
          means that in principle they could be read on the server.
        </p>
        <p>
          We are telling you this plainly because the alternative — implying a
          guarantee we do not provide — is worse than not providing it. If that
          matters for a particular conversation, use an app built specifically
          for it.
        </p>
      </Section>

      <Section heading="Who else sees your data">
        <p>
          Your profile is visible to people you are connected to, and to anyone
          who has your exact username or invite link. Nobody else can look you
          up, and there is no directory to browse.
        </p>
        <p>
          We use Supabase for the database and authentication, and Vercel for
          hosting. Data is stored in India. We do not sell data, and we do not
          share it with advertisers.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can edit or clear any profile field at any time, block anyone,
          request a copy of your data, or delete your account. Deleting
          deactivates immediately and removes your profile, messages,
          connections and uploads within 30 days.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions, data requests, or complaints: reach the grievance contact
          at <strong className="text-tx-hi">[support email — to be added]</strong>
          , or write to{" "}
          <strong className="text-tx-hi">[registered address — to be added]</strong>
          .
        </p>
        <p className="text-tx-lo">
          This policy will carry a last-updated date once MusiChat is publicly
          launched.
        </p>
      </Section>
    </PublicPage>
  );
}
