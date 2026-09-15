import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { TrackSearch } from "@/components/player/TrackSearch";

export const metadata: Metadata = {
  title: "Music",
  robots: { index: false, follow: false },
};

export default async function MusicPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Music" />

      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-5 py-6">
        <p className="mb-5 text-[13px] leading-relaxed text-tx-mid">
          Independent artists from Audius and the Internet Archive — free, and
          free for whoever you listen with. Playing a track here keeps it going
          as you move around the app.
        </p>

        <TrackSearch />

        {/* The mini player is fixed to the bottom edge, so the last result
            needs room to clear it. */}
        <div aria-hidden="true" className="h-24" />
      </div>
    </div>
  );
}
