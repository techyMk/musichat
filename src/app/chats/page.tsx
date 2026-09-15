import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export const metadata: Metadata = {
  title: "Chats",
  // App routes are never indexable — QUALITY-CHECKLIST.md §0.
  robots: { index: false, follow: false },
};

export default async function ChatsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // No profile row means onboarding was never finished (see migration 0001 —
  // the row is created when the username is claimed, not at signup).
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/username");

  const name = profile.display_name || profile.username;

  return (
    <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-6">
      <header className="mb-10 flex items-center gap-3">
        <Avatar name={name} src={profile.avatar_url} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[21px] font-bold tracking-tight text-tx-hi">
            Musi
            <span className="bg-[image:var(--together)] bg-clip-text text-transparent">
              Chat
            </span>
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center">
        <h1 className="font-display text-[25px] leading-tight font-bold tracking-tight text-tx-hi">
          It&apos;s quiet in here
        </h1>
        <p className="max-w-[34ch] text-[13px] leading-relaxed text-tx-mid">
          This app needs two people. Friends and invites arrive in the next
          milestone — for now, you&apos;re signed in as @{profile.username}.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-1">
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
    </main>
  );
}
