import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  // The root IS the landing page, so it is its own canonical.
  alternates: { canonical: "/" },
};

export default async function Home() {
  // Signed-in visitors have no use for the pitch.
  if (await getUser()) redirect("/chats");

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-sm flex-1 flex-col px-6 py-14"
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Image
          src="/brand/icon-transparent.png"
          alt=""
          width={104}
          height={104}
          priority
          className="mb-7 h-26 w-26"
        />

        <h1 className="font-display mb-3 text-[30px] leading-[1.15] font-bold tracking-tight text-tx-hi text-balance">
          Even when you&apos;re apart, listen together.
        </h1>

        <p className="text-[14px] leading-relaxed text-tx-mid text-balance">
          Chat and play the same song at the same moment, with the one person
          you&apos;d text at 2am.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <ButtonLink href="/signup" full>
          Create an account
        </ButtonLink>
        <ButtonLink href="/login" variant="ghost" full>
          I already have one
        </ButtonLink>
      </div>
    </main>
  );
}
