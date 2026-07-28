"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActivityKind } from "@prisma/client";

import { KIND_META } from "@/components/activity-kind";
import { Button, Card, FormError, Textarea } from "@/components/ui";
import { compressImage } from "@/lib/compress-image";
import { NOTE_MAX, PHOTO_MAX_BYTES } from "@/lib/validation";

const KINDS: ActivityKind[] = ["RIDE", "PIT", "SPORT"];
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

type Picked = { file: File; preview: string };

function PhotoInput({
  id,
  label,
  picked,
  error,
  onPick,
  onClear,
}: {
  id: string;
  label: string;
  picked: Picked | null;
  error?: string;
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

      {picked ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={picked.preview}
            alt=""
            className="h-32 w-full rounded-lg border border-line object-cover"
          />
          <button
            type="button"
            onClick={() => {
              onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-1.5 top-1.5 rounded-md bg-surface/90 px-2 py-1 text-xs font-medium text-fg backdrop-blur"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-line-strong text-sm text-muted hover:bg-sunken hover:text-fg"
        >
          Add photo
        </button>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function LogForm({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<ActivityKind>("RIDE");
  const [note, setNote] = useState("");
  const [before, setBefore] = useState<Picked | null>(null);
  const [after, setAfter] = useState<Picked | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  // Object URLs leak until revoked; drop them whenever the picked file changes.
  useEffect(() => () => { if (before) URL.revokeObjectURL(before.preview); }, [before]);
  useEffect(() => () => { if (after) URL.revokeObjectURL(after.preview); }, [after]);

  function makePicker(
    field: "beforePhoto" | "afterPhoto",
    set: (p: Picked | null) => void,
  ) {
    return async (file: File | null) => {
      setErrors((e) => ({ ...e, [field]: "" }));
      if (!file) return set(null);

      const shrunk = await compressImage(file);
      if (shrunk.size > PHOTO_MAX_BYTES) {
        setErrors((e) => ({ ...e, [field]: "That photo is over 8MB — pick a smaller one." }));
        return set(null);
      }
      set({ file: shrunk, preview: URL.createObjectURL(shrunk) });
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    const body = new FormData();
    body.set("kind", kind);
    body.set("note", note);
    if (before) body.set("beforePhoto", before.file);
    if (after) body.set("afterPhoto", after.file);

    try {
      const res = await fetch(`/api/missions/${missionId}/activities`, {
        method: "POST",
        body,
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(payload.errors ?? { form: "Could not save that. Try again." });
        return;
      }

      setNote("");
      setBefore(null);
      setAfter(null);
      router.refresh();
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection." });
    } finally {
      setPending(false);
    }
  }

  const remaining = NOTE_MAX - note.length;

  return (
    <Card className="px-4 py-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError>{errors.form}</FormError>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium">What did you do?</span>
          <div
            role="radiogroup"
            aria-label="Activity type"
            className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-sunken p-1"
          >
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={`h-9 rounded-md text-sm font-medium transition-colors ${
                  kind === k
                    ? "bg-surface text-fg shadow-[0_0_0_1px_var(--line)]"
                    : "text-muted hover:text-fg"
                }`}
              >
                {KIND_META[k].short}
              </button>
            ))}
          </div>
          {errors.kind ? <p className="text-sm text-danger">{errors.kind}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PhotoInput
            id="before-photo"
            label="Before"
            picked={before}
            error={errors.beforePhoto}
            onPick={makePicker("beforePhoto", setBefore)}
            onClear={() => setBefore(null)}
          />
          <PhotoInput
            id="after-photo"
            label="After"
            picked={after}
            error={errors.afterPhoto}
            onPick={makePicker("afterPhoto", setAfter)}
            onClear={() => setAfter(null)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Note</span>
            <span
              className={`tabular text-xs ${remaining < 0 ? "text-danger" : "text-subtle"}`}
            >
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

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Logging…" : `Log ${KIND_META[kind].label.toLowerCase()}`}
        </Button>
      </form>
    </Card>
  );
}
