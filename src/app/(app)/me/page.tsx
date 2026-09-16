import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { ProfileForm } from "@/app/onboarding/profile/ProfileForm";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  BlockedList,
  DeleteAccount,
  type BlockedUser,
} from "@/components/safety/DangerZone";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, genres, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/username");

  const { data: blockedRows } = await supabase.rpc("my_blocks");
  const blocked = (blockedRows ?? []) as BlockedUser[];

  const joined = new Date(profile.created_at).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div id="main" className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Your profile" />

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 py-6">
        <div className="mb-6 rounded-[var(--r-md)] border border-ink-600 bg-ink-800/60 px-4 py-3">
          <p className="text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Your username
          </p>
          <p className="font-display mt-0.5 text-[20px] font-bold tracking-tight text-tx-hi">
            @{profile.username}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-tx-lo">
            This is how friends find you, and it can&apos;t be changed. Joined{" "}
            {joined}.
          </p>
        </div>

        <ProfileForm
          userId={user.id}
          username={profile.username}
          displayName={profile.display_name ?? ""}
          bio={profile.bio ?? ""}
          genres={profile.genres ?? []}
          avatarUrl={profile.avatar_url}
          next="/me"
          submitLabel="Save changes"
          showSkip={false}
        />

        <section className="mt-10 border-t border-ink-600 pt-6">
          <h2 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Blocked
          </h2>
          <BlockedList blocked={blocked} />
        </section>

        <section className="mt-10 border-t border-ink-600 pt-6">
          <h2 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
            Account
          </h2>

          <p className="mb-4 text-[12.5px] leading-relaxed text-tx-mid">
            Signed in as {user.email}.
          </p>

          <div className="flex flex-col gap-1.5">
            <form action={signOut}>
              <Button variant="ghost" full type="submit">
                Sign out
              </Button>
            </form>
            <form action={signOut}>
              <input type="hidden" name="scope" value="global" />
              <Button variant="skip" full type="submit">
                Sign out on all devices
              </Button>
            </form>
          </div>

          <div className="mt-6">
            <DeleteAccount />
          </div>
        </section>

        <nav className="mt-8 flex justify-center gap-4 text-[12px] text-tx-lo">
          <Link href="/about" className="hover:text-tx-mid">
            About
          </Link>
          <Link href="/privacy" className="hover:text-tx-mid">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-tx-mid">
            Terms
          </Link>
        </nav>
      </div>
    </div>
  );
}
