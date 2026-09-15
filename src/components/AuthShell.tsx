import Link from "next/link";

/** Shared frame for the signed-out screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-14"
    >
      <Link
        href="/"
        className="font-display mb-10 text-[21px] font-bold tracking-tight text-tx-hi"
      >
        Musi
        <span className="bg-[image:var(--together)] bg-clip-text text-transparent">
          Chat
        </span>
      </Link>

      <h1 className="font-display mb-1.5 text-[25px] leading-tight font-bold tracking-tight text-tx-hi">
        {title}
      </h1>
      {subtitle && (
        <p className="mb-7 text-[13px] leading-relaxed text-tx-mid">{subtitle}</p>
      )}

      {children}

      {footer && <div className="mt-7">{footer}</div>}
    </main>
  );
}

/** Inline error shown above a form's submit button. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-[var(--r-sm)] border border-[rgba(249,69,69,0.3)] bg-[rgba(249,69,69,0.1)] px-3 py-2 text-[12.5px] font-semibold text-danger"
    >
      {message}
    </p>
  );
}
