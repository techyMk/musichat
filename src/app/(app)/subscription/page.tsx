import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PlanCard } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Subscription",
  robots: { index: false, follow: false },
};

/**
 * There is no paid tier, and PRD assumption A6 keeps the whole MVP free with
 * no ads. This page exists so the plan is stated rather than left ambiguous —
 * a billing screen showing invented prices for a product nobody pays for would
 * be worse than saying plainly that everything is free.
 */
export default async function SubscriptionPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Subscription" />

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-6">
        <div className="mb-7 flex items-center gap-3 rounded-[var(--r-md)] border border-ink-600 bg-ink-800/60 px-4 py-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[image:var(--together)] text-[15px] font-bold text-white">
            ✓
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-tx-hi">
              You&apos;re on the Free plan
            </p>
            <p className="text-[12.5px] text-tx-lo">
              Nothing to pay, nothing expiring. No card on file.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            featured
            name="Free"
            price="₹0"
            summary="Everything MusiChat does today, for you and whoever you invite."
            features={[
              "Synchronised listening with one person at a time",
              "Unlimited messages and conversations",
              "Full catalogue of independently licensed music",
              "No ads, ever",
            ]}
          />
          <PlanCard
            unavailable
            name="Plus"
            price="Later"
            summary="If a paid tier arrives it will cover extras, never the core."
            features={[
              "Shared playlists and a collaborative queue",
              "Listening history and anniversaries",
              "Group sessions beyond two people",
              "Synchronised listening stays free regardless",
            ]}
          />
        </div>

        <section className="mt-8 rounded-[var(--r-lg)] border border-ink-600 bg-ink-800/40 p-5">
          <h2 className="mb-2 text-[14.5px] font-bold text-tx-hi">
            Why there&apos;s nothing to buy
          </h2>
          <p className="mb-3 text-[13.5px] leading-relaxed text-tx-mid">
            Shared listening only works when both people can use it. Spotify and
            Apple both put theirs behind a subscription on both sides, which is
            why most people never use those features — you need the other person
            to be paying for the same thing you are.
          </p>
          <p className="text-[13.5px] leading-relaxed text-tx-mid">
            Keeping the core free is the product decision, not a launch promo.
            If that ever changes, you&apos;ll hear it in the app first.{" "}
            <Link href="/terms" className="text-you-500 hover:underline">
              Terms
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
