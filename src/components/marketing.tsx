import Link from "next/link";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  center = false,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-8", center && "text-center")}>
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-tx-lo uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display mb-2 text-[26px] leading-tight font-bold tracking-tight text-balance text-tx-hi sm:text-[32px]">
        {title}
      </h2>
      {lede && (
        <p
          className={cn(
            "max-w-[52ch] text-[14px] leading-relaxed text-tx-mid sm:text-[15px]",
            center && "mx-auto",
          )}
        >
          {lede}
        </p>
      )}
    </div>
  );
}

export function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-lg)] border border-ink-600 bg-ink-800/60 p-5 backdrop-blur-sm",
        className,
      )}
    >
      <h3 className="mb-1.5 text-[15px] font-bold text-tx-hi">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-tx-mid">{children}</p>
    </div>
  );
}

/**
 * Native details/summary — the FAQ works with JavaScript disabled and needs no
 * client component.
 */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col divide-y divide-ink-600 border-y border-ink-600">
      {items.map(({ q, a }) => (
        <details key={q} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 py-4 text-[14.5px] font-bold text-tx-hi marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="flex-1">{q}</span>
            <span
              aria-hidden="true"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink-500 text-[15px] leading-none text-tx-mid transition-transform duration-[var(--dur-base)] group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-4 text-[13.5px] leading-relaxed text-tx-mid">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function PlanCard({
  name,
  price,
  cadence,
  summary,
  features,
  cta,
  featured = false,
  unavailable = false,
}: {
  name: string;
  price: string;
  cadence?: string;
  summary: string;
  features: string[];
  cta?: { label: string; href: string };
  featured?: boolean;
  unavailable?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-[var(--r-lg)] border p-6",
        featured
          ? "border-you-500/40 bg-ink-800/80 shadow-[0_24px_60px_-40px_rgba(255,79,151,0.6)]"
          : "border-ink-600 bg-ink-800/40",
        unavailable && "opacity-70",
      )}
    >
      <div className="mb-4 flex items-baseline gap-2">
        <h3 className="text-[15px] font-bold text-tx-hi">{name}</h3>
        {featured && (
          <span className="rounded-full bg-[image:var(--together)] px-2 py-0.5 text-[10px] font-bold text-white">
            Current
          </span>
        )}
      </div>

      <p className="font-display mb-1 text-[34px] leading-none font-bold tracking-tight text-tx-hi">
        {price}
        {cadence && (
          <span className="ml-1.5 text-[13px] font-semibold text-tx-lo">
            {cadence}
          </span>
        )}
      </p>
      <p className="mb-5 text-[13px] leading-relaxed text-tx-mid">{summary}</p>

      <ul className="mb-6 flex flex-1 flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[13px] text-tx-mid">
            <span aria-hidden="true" className="text-you-500">
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {cta ? (
        <Link
          href={cta.href}
          className="rounded-full bg-[image:var(--together)] py-3 text-center text-[14px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(255,79,151,0.7)] transition-[filter] duration-[var(--dur-fast)] hover:brightness-110"
        >
          {cta.label}
        </Link>
      ) : (
        <p className="rounded-full border border-ink-500 py-3 text-center text-[13px] font-semibold text-tx-lo">
          Not available yet
        </p>
      )}
    </div>
  );
}
