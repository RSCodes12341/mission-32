import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-xl border border-line bg-surface", className)} {...props} />;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
      {sub ? <p className="text-sm text-muted">{sub}</p> : null}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      {aside}
    </div>
  );
}

// 44px minimum height throughout: this is used one-handed, outdoors, in a hurry.
const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium " +
  "transition-[background-color,color,border-color,opacity] duration-(--dur-fast) " +
  "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55";

const BUTTON_VARIANTS = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border border-line bg-surface text-fg hover:border-line-strong hover:bg-sunken",
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
        <span className="block text-sm text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-lg border border-line bg-surface px-3 text-base text-fg " +
  "placeholder:text-subtle transition-colors duration-(--dur-fast) " +
  "hover:border-line-strong focus:border-line-strong focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 " +
  "disabled:opacity-55";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(CONTROL, "min-h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(CONTROL, "resize-y py-2.5", className)} {...props} />;
}

/** Form-level error, distinct from per-field errors. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="pop-in rounded-lg border border-line bg-danger-soft px-3 py-2.5 text-sm text-danger"
    >
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="px-5 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children ? (
        <div className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{children}</div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}

/** A goal's colour comes from its own stored hue. */
export function goalStyle(hue: number) {
  return { "--goal-hue": String(hue) } as React.CSSProperties;
}

export function GoalBadge({
  name,
  hue,
  className,
}: {
  name: string;
  hue: number;
  className?: string;
}) {
  return (
    <span
      style={goalStyle(hue)}
      className={cx(
        "goal-soft inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {name}
    </span>
  );
}

export function ProgressBar({
  ratio,
  hue,
  label,
  className,
}: {
  ratio: number;
  hue?: number;
  label: string;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <div
      className={cx("h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx(
          "h-full rounded-full transition-[width] duration-500 ease-(--ease-out)",
          hue === undefined ? "bg-accent" : "goal-bg",
        )}
        style={{
          // Floor of 3px so "1 of 15" still reads as visibly non-zero.
          width: pct === 0 ? "0" : `max(3px, ${pct}%)`,
          ...(hue === undefined ? {} : goalStyle(hue)),
        }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}
