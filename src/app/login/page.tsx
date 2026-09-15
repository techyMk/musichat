import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to MusiChat.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up where you left off."
      footer={
        <p className="text-center text-[13px] text-tx-lo">
          New here?{" "}
          <Link href="/signup" className="font-bold text-you-500 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm
        next={next}
        linkError={
          params.error === "link"
            ? "That link has expired or was already used. Log in, or request a new one."
            : undefined
        }
      />
    </AuthShell>
  );
}
