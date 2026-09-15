import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`If ${sent} has an account, a reset link is on its way. It expires in an hour.`}
        footer={
          <p className="text-center text-[13px] text-tx-lo">
            <Link href="/login" className="font-bold text-you-500 hover:underline">
              Back to log in
            </Link>
          </p>
        }
      >
        <p className="text-[13px] leading-relaxed text-tx-mid">
          Nothing after a few minutes? Check spam, then{" "}
          <Link href="/forgot" className="font-bold text-you-500 hover:underline">
            try again
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <p className="text-center text-[13px] text-tx-lo">
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-you-500 hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
