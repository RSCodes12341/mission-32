import { Card } from "@/components/ui";

type Props = {
  label: string;
  hint?: string;
  current: number;
  target: number;
  barClass: string;
};

export function ProgressCard({ label, hint, current, target, barClass }: Props) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = target > 0 && current >= target;

  return (
    <Card className="px-4 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        {done ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            Done
          </span>
        ) : null}
      </div>

      <p className="tabular mt-1 text-2xl font-semibold">
        {current}
        <span className="text-base font-normal text-subtle"> / {target}</span>
      </p>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`${label}: ${current} of ${target}`}
      >
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>

      {hint ? <p className="mt-2 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}
