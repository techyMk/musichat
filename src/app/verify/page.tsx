import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { VerifyPanel } from "./VerifyPanel";

export const metadata: Metadata = {
  title: "Confirm your email",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell
      title="Check your email"
      subtitle={
        email
          ? `We sent a confirmation link to ${email}. Open it and you're in.`
          : "We sent you a confirmation link. Open it and you're in."
      }
    >
      <VerifyPanel email={email ?? ""} />
    </AuthShell>
  );
}
