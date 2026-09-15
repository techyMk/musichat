import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center"
    >
      <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
        404
      </p>

      <h1 className="font-display mb-3 text-3xl leading-tight font-bold tracking-tight text-tx-hi">
        This link doesn&apos;t go anywhere
      </h1>

      <p className="mb-8 text-[15px] leading-relaxed text-tx-mid">
        The page may have moved, or the link might be mistyped. Either way,
        there&apos;s nothing here to listen to.
      </p>

      <ButtonLink href="/" full>
        Back to your chats
      </ButtonLink>
    </main>
  );
}
