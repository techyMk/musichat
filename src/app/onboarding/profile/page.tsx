import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { AuthShell } from "@/components/AuthShell";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: "Set up your profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, genres, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // No username yet — that step comes first.
  if (!profile) redirect("/onboarding/username");

  return (
    <AuthShell
      title="Tell people who you are"
      subtitle="All of this is optional, and you can change it whenever."
    >
      <ProfileForm
        userId={user.id}
        username={profile.username}
        displayName={profile.display_name ?? ""}
        bio={profile.bio ?? ""}
        genres={profile.genres ?? []}
        avatarUrl={profile.avatar_url}
      />
    </AuthShell>
  );
}
