"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, EmptyState, GoalBadge, cx } from "@/components/ui";
import { PhotoViewer, type ViewerPhoto } from "@/components/photo-viewer";

export type FeedItem = {
  id: string;
  note: string | null;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  createdAt: string | Date;
  userId: string;
  goal: { id: string; name: string; hue: number };
  user: { id: string; name: string };
  participants: { user: { id: string; name: string } }[];
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) return "Today";
  if (dayKey(date) === dayKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

/** "Ronith", "Ronith and Priya", "Ronith, Priya and Sam" */
function nameList(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function Thumb({ url, label, onOpen }: { url: string; label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block overflow-hidden rounded-lg border border-line"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`${label} photo`}
        loading="lazy"
        className="h-24 w-full object-cover transition-opacity group-hover:opacity-90"
      />
      <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-2xs font-medium text-white">
        {label}
      </span>
    </button>
  );
}

export function ActivityFeed({
  activities,
  currentUserId,
}: {
  activities: FeedItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [viewing, setViewing] = useState<ViewerPhoto | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Grouped in the browser so days break on the viewer's midnight, not the server's.
  const groups = useMemo(() => {
    const out: Array<{ key: string; label: string; items: FeedItem[] }> = [];
    for (const item of activities) {
      const date = new Date(item.createdAt);
      const key = dayKey(date);
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push(item);
      else out.push({ key, label: dayLabel(date), items: [item] });
    }
    return out;
  }, [activities]);

  async function remove(id: string) {
    if (!window.confirm("Delete this entry? It comes off everyone's tally who was on it."))
      return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (activities.length === 0) {
    return (
      <EmptyState title="Nothing logged yet">
        The first entry sets the tone. Use the form above — it takes about ten seconds.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.key} className="space-y-2">
            <h3 suppressHydrationWarning className="text-xs font-medium text-subtle">
              {group.label}
            </h3>

            <ul className="space-y-2">
              {group.items.map((item) => {
                const time = new Date(item.createdAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const names = item.participants.map((p) => p.user.name);
                const shared = names.length > 1;
                const mine = item.userId === currentUserId;

                return (
                  <li key={item.id}>
                    <Card className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium">
                          {shared ? nameList(names) : item.user.name}
                        </span>
                        <GoalBadge name={item.goal.name} hue={item.goal.hue} />
                        <span suppressHydrationWarning className="text-xs text-subtle">
                          {time}
                        </span>
                        {shared ? (
                          <span className="rounded-full bg-sunken px-2 py-0.5 text-2xs font-medium text-muted">
                            together
                          </span>
                        ) : null}

                        {mine ? (
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            disabled={deleting === item.id}
                            className={cx(
                              "ml-auto min-h-9 rounded-md px-2 text-xs text-subtle transition-colors",
                              "hover:bg-danger-soft hover:text-danger disabled:opacity-50",
                            )}
                          >
                            {deleting === item.id ? "Deleting…" : "Delete"}
                          </button>
                        ) : null}
                      </div>

                      {item.note ? (
                        <p className="mt-1.5 whitespace-pre-wrap text-sm">{item.note}</p>
                      ) : null}

                      {item.beforePhotoUrl || item.afterPhotoUrl ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {item.beforePhotoUrl ? (
                            <Thumb
                              url={item.beforePhotoUrl}
                              label="Before"
                              onOpen={() =>
                                setViewing({
                                  url: item.beforePhotoUrl!,
                                  label: "Before",
                                  caption: `${nameList(names)}, ${time}`,
                                })
                              }
                            />
                          ) : (
                            <span />
                          )}
                          {item.afterPhotoUrl ? (
                            <Thumb
                              url={item.afterPhotoUrl}
                              label="After"
                              onOpen={() =>
                                setViewing({
                                  url: item.afterPhotoUrl!,
                                  label: "After",
                                  caption: `${nameList(names)}, ${time}`,
                                })
                              }
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <PhotoViewer photo={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
