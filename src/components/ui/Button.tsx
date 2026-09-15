import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * DESIGN.md §5.6. One primary per screen, carrying the ring gradient — so the
 * most important action on any screen is literally coloured like togetherness.
 */
export type ButtonVariant = "primary" | "quiet" | "ghost" | "skip" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[image:var(--together)] text-white shadow-[0_10px_24px_-12px_rgba(255,79,151,0.7)] hover:brightness-110",
  quiet: "bg-ink-700 text-tx-hi hover:bg-ink-600",
  ghost: "border border-ink-500 text-tx-hi hover:border-you-500 hover:bg-ink-700",
  // Never styled as a button — skipping has to feel free, not like a decision.
  skip: "text-tx-lo hover:text-tx-mid",
  danger: "text-danger hover:bg-[rgba(249,69,69,0.1)]",
};

type CommonProps = {
  variant?: ButtonVariant;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
};

function classesFor(variant: ButtonVariant, full: boolean, extra?: string) {
  return cn(
    // 44px minimum tap target, per the accessibility floor in DESIGN.md §7.
    "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3",
    "text-[14.5px] font-bold tracking-[-0.01em]",
    "transition-[filter,background-color,border-color,color] duration-[var(--dur-fast)] ease-brand",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    full && "w-full",
    extra,
  );
}

export function Button({
  variant = "primary",
  full = false,
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classesFor(variant, full, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  full = false,
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link href={href} className={classesFor(variant, full, className)} {...rest}>
      {children}
    </Link>
  );
}
