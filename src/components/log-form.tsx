"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, FormError, Textarea, cx, goalStyle } from "@/components/ui";
import { compressImage } from "@/lib/compress-image";
import { NOTE_MAX, PHOTO_MAX_BYTES } from "@/lib/validation";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

export type LogGoal = { id: string; name: string; hue: number; remaining: number };
export type LogMember = { id: string; name: string };

type Picked = { file: File; preview: string };

function PhotoInput({
  id,
  label,
  picked,
  error,
  busy,
  onPick,
  onClear,
}: {
  id: string;
  label: string;
  picked: Picked | null;
  error?: string;
  busy: boolean;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      {busy ? (
        <div className="skeleton h-28 w-full rounded-lg" />
      ) : picked ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={picked.preview}
            alt=""
            className="h-28 w-full rounded-lg border border-line object-cover"
          />
          <button
            type="button"
            onClick={() => {
              onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-1.5 top-1.5 min-h-8 rounded-md bg-surface/90 px-2 text-xs font-medium backdrop-blur transition-colors hover:bg-surface"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-line-strong text-sm text-muted transition-colors hover:bg-sunken hover:text-fg"
        >
          Add photo
        </button>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function LogForm({
  missionId,
  goals,
  members,
  currentUserId,
}: {
  missionId: string;
  goals: LogGoal[];
  members: LogMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const others = members.filter((m) => m.id !== currentUserId);

  // Default to the first goal that still has sessions owed.
  const [goalId, setGoalId] = useState(
    () => (goals.find((g) => g.remaining > 0) ?? goals[0])?.id ?? "",
  );
  const [note, setNote] = useState("");
  const [withIds, setWithIds] = useState<string[]>([]);
  const [before, setBefore] = useState<Picked | null>(null);
  const [after, setAfter] = useState<Picked | null>(null);
  const [shrinking, setShrinking] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Object URLs leak until revoked; drop them whenever the picked file changes.
  useEffect(() => () => { if (before) URL.revokeObjectURL(before.preview); }, [before]);
  useEffect(() => () => { if (after) URL.revokeObjectURL(after.preview); }, [after]);

  function makePicker(field: "beforePhoto" | "afterPhoto", set: (p: Picked | null) => void) {
    return async (file: File | null) => {
      setErrors((e) => ({ ...e, [field]: "" }));
      if (!file) return set(null);

      setShrinking((s) => ({ ...s, [field]: true }));
      try {
        const shrunk = await compressImage(file);
        if (shrunk.size > PHOTO_MAX_BYTES) {
          setErrors((e) => ({ ...e, [field]: "That photo is over 8MB — pick a smaller one." }));
          return set(null);
        }
        set({ file: shrunk, preview: URL.createObjectURL(shrunk) });
      } finally {
        setShrinking((s) => ({ ...s, [field]: false }));
      }
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    const body = new FormData();
    body.set("goalId", goalId);
    body.set("note", note);
    for (const id of withIds) body.append("participantIds", id);
    if (before) body.set("beforePhoto", before.file);
    if (after) body.set("afterPhoto", after.file);

    try {
      const res = await fetch(`/api/missions/${missionId}/activities`, { method: "POST", body });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(payload.errors ?? { form: "Could not save that. Try again." });
        return;
      }

      setNote("");
      setBefore(null);
      setAfter(null);
      setWithIds([]);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2600);
      router.refresh();
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection." });
    } finally {
      setPending(false);
    }
  }

  const remaining = NOTE_MAX - note.length;
  const selected = goals.find((g) => g.id === goalId);
  const busy = pending || Object.values(shrinking).some(Boolean);

  if (goals.length === 0) {
    return (
      <Card className="px-4 py-6 text-center text-sm text-muted">
        This mission has nothing to count yet.
      </Card>
    );
  }

  return (
    <Card className="px-4 py-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError>{errors.form}</FormError>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium">What did you do?</span>
          <div role="radiogroup" aria-label="What did you do?" className="flex flex-wrap gap-2">
            {goals.map((g) => {
              const active = goalId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setGoalId(g.id)}
                  style={goalStyle(g.hue)}
                  className={cx(
                    "min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors duration-(--dur-fast)",
                    active
                      ? "goal-soft border-transparent shadow-[inset_0_0_0_1.5px_currentColor]"
                      : "border-line text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {g.name}
                  {g.remaining > 0 ? (
                    <span className="tabular ml-1.5 text-xs opacity-70">{g.remaining} left</span>
                  ) : (
                    <span className="ml-1.5 text-xs opacity-70">done</span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.goalId ? <p className="text-sm text-danger">{errors.goalId}</p> : null}
        </div>

        {others.length > 0 ? (
          <div className="space-y-1.5">
            <span className="block text-sm font-medium">
              Anyone with you?{" "}
              <span className="font-normal text-muted">Counts for them too</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {others.map((m) => {
                const on = withIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() =>
                      setWithIds((ids) =>
                        on ? ids.filter((i) => i !== m.id) : [...ids, m.id],
                      )
                    }
                    className={cx(
                      "min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors duration-(--dur-fast)",
                      on
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {on ? "✓ " : ""}
                    {m.name}
                  </button>
                );
              })}
            </div>
            {errors.participantIds ? (
              <p className="text-sm text-danger">{errors.participantIds}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <PhotoInput
            id="before-photo"
            label="Before"
            picked={before}
            busy={Boolean(shrinking.beforePhoto)}
            error={errors.beforePhoto}
            onPick={makePicker("beforePhoto", setBefore)}
            onClear={() => setBefore(null)}
          />
          <PhotoInput
            id="after-photo"
            label="After"
            picked={after}
            busy={Boolean(shrinking.afterPhoto)}
            error={errors.afterPhoto}
            onPick={makePicker("afterPhoto", setAfter)}
            onClear={() => setAfter(null)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Note</span>
            <span className={cx("tabular text-xs", remaining < 20 ? "text-danger" : "text-subtle")}>
              {remaining}
            </span>
          </div>
          <Textarea
            rows={2}
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional — where did you go?"
          />
          {errors.note ? <p className="text-sm text-danger">{errors.note}</p> : null}
        </div>

        <Button type="submit" className="w-full" disabled={busy || !goalId}>
          {pending
            ? "Saving…"
            : justSaved
              ? "Saved"
              : `Log ${selected ? selected.name.toLowerCase() : "it"}${
                  withIds.length ? ` for ${withIds.length + 1}` : ""
                }`}
        </Button>

        <p aria-live="polite" className="sr-only">
          {justSaved ? "Session logged" : ""}
        </p>
      </form>
    </Card>
  );
}
