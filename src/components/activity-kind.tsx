import type { ActivityKind } from "@prisma/client";

export const KIND_META: Record<
  ActivityKind,
  { label: string; short: string; badge: string; bar: string }
> = {
  RIDE: {
    label: "Ride",
    short: "Ride",
    badge: "bg-ride-soft text-ride",
    bar: "bg-ride",
  },
  PIT: {
    label: "Pit exploration",
    short: "Pit",
    badge: "bg-pit-soft text-pit",
    bar: "bg-pit",
  },
  SPORT: {
    label: "Sport day",
    short: "Sport",
    badge: "bg-sport-soft text-sport",
    bar: "bg-sport",
  },
};

export function KindBadge({ kind }: { kind: ActivityKind }) {
  const meta = KIND_META[kind];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}
