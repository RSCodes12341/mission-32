import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-xl border border-line bg-surface", className)}
      {...props}
    />
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
      {sub ? <p className="text-sm text-muted">{sub}</p> : null}
    </div>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

const BUTTON_VARIANTS = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border border-line bg-surface text-fg hover:bg-sunken",
  ghost: "text-muted hover:bg-sunken hover:text-fg",
  danger: "border border-line bg-surface text-danger hover:bg-danger-soft",
} as const;

type Variant = keyof typeof BUTTON_VARIANTS;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props} />;
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="block text-sm text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-sm text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "w-full rounded-lg border border-line bg-surface px-3 h-10 text-base",
        "placeholder:text-subtle focus:border-line-strong focus:outline-none",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cx(
        "w-full rounded-lg border border-line bg-surface px-3 py-2 text-base resize-y",
        "placeholder:text-subtle focus:border-line-strong focus:outline-none",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1",
        className,
      )}
      {...props}
    />
  );
}

/** Form-level error, distinct from per-field errors. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-line bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {children}
    </p>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="px-5 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1 text-sm text-muted">{children}</div> : null}
    </Card>
  );
}
