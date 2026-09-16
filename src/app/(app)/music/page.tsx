import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { listMyUploads } from "@/lib/music/uploads";
import { PageHeader } from "@/components/PageHeader";
import { TrackSearch } from "@/components/player/TrackSearch";
import { UploadTracks, type MyUpload } from "@/components/uploads/UploadTracks";

export const metadata: Metadata = {
  title: "Music",
  robots: { index: false, follow: false },
};

export default async function MusicPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const uploads = (await listMyUploads(supabase, user.id)) as MyUpload[];
  const usedBytes = uploads.reduce((sum, u) => sum + Number(u.size_bytes), 0);

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Music" />

      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-5 py-6">
        <p className="mb-5 text-[13px] leading-relaxed text-tx-mid">
          Independent artists from Audius and the Internet Archive, plus
          anything you add yourself. Your own tracks appear first in search.
        </p>

        <TrackSearch />

        <div className="my-8 border-t border-ink-600" />

        <h2 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
          Your tracks
        </h2>
        <UploadTracks
          userId={user.id}
          initial={uploads}
          usedBytes={usedBytes}
        />

        {/* The mini player is fixed to the bottom edge, so the last result
            needs room to clear it. */}
        <div aria-hidden="true" className="h-24" />
      </div>
    </div>
  );
}
