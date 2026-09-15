import Link from "next/link";

/** Shared frame for the signed-out content pages: about, privacy, terms. */
export function PublicPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:py-16">
      <Link
        href="/"
        className="font-display mb-10 inline-block text-[21px] font-bold tracking-tight text-tx-hi"
      >
        Musi
        <span className="bg-[image:var(--together)] bg-clip-text text-transparent">
          Chat
        </span>
      </Link>

      {eyebrow && (
        <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
          {eyebrow}
        </p>
      )}

      <h1 className="font-display mb-3 text-[30px] leading-tight font-bold tracking-tight text-balance text-tx-hi sm:text-[38px]">
        {title}
      </h1>

      {lede && (
        <p className="mb-10 text-[15px] leading-relaxed text-tx-mid">{lede}</p>
      )}

      <div className="flex flex-col gap-8">{children}</div>

      <PublicFooter />
    </main>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-[16px] font-bold text-tx-hi sm:text-[17px]">
        {heading}
      </h2>
      <div className="flex flex-col gap-3 text-[13.5px] leading-relaxed text-tx-mid sm:text-[14px]">
        {children}
      </div>
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-600 pt-6 text-[12.5px] text-tx-lo">
      <Link href="/" className="hover:text-tx-mid">
        Home
      </Link>
      <Link href="/about" className="hover:text-tx-mid">
        About
      </Link>
      <Link href="/privacy" className="hover:text-tx-mid">
        Privacy
      </Link>
      <Link href="/terms" className="hover:text-tx-mid">
        Terms
      </Link>
      <span className="ml-auto">Built for two people at a time.</span>
    </footer>
  );
}
