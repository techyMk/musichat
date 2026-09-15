import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { AuthShell } from "@/components/AuthShell";
import { UsernameForm } from "./UsernameForm";

export const metadata: Metadata = {
  title: "Pick your username",
  robots: { index: false, follow: false },
};

export default async function UsernamePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Already claimed — nothing to do here.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) redirect("/chats");

  return (
    <AuthShell
      title="Pick your username"
      subtitle="This is how friends find you. It's the only thing we actually need."
    >
      <UsernameForm />
    </AuthShell>
  );
}
