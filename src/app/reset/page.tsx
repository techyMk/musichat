import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Once you save this, you'll be signed out everywhere else."
    >
      <ResetForm />
    </AuthShell>
  );
}
