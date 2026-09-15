import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton, OrDivider } from "@/components/GoogleButton";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a MusiChat account and start listening together with the people you care about.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  return (
    <AuthShell
      title="Create an account"
      subtitle="Takes about thirty seconds."
      footer={
        <p className="text-center text-[13px] text-tx-lo">
          Already have one?{" "}
          <Link href="/login" className="font-bold text-you-500 hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      <SignupForm invite={invite} />
      <OrDivider />
      <GoogleButton
        next={invite ? `/invite/${encodeURIComponent(invite)}` : "/chats"}
      />
    </AuthShell>
  );
}
