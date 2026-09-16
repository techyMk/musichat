import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings";
import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const settings = await loadSettings(supabase);

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Privacy" backHref="/me" backLabel="Back to profile" />

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 py-6">
        <p className="mb-6 text-[13px] leading-relaxed text-tx-mid">
          MusiChat never collects location and has no public directory. These
          control what the people you&apos;re connected to can see.
        </p>

        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
