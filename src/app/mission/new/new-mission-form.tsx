"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Field, FormError, Input } from "@/components/ui";

export function NewMissionForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          rideTarget: data.get("rideTarget"),
          pitTarget: data.get("pitTarget"),
          sportTarget: data.get("sportTarget"),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.errors ?? { form: "Could not create the mission. Try again." });
        return;
      }

      router.push(`/mission/${body.mission.id}`);
      router.refresh();
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError>{errors.form}</FormError>

      <Field label="Mission name" error={errors.name}>
        <Input name="name" defaultValue="Mission 32" required maxLength={80} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Rides" error={errors.rideTarget}>
          <Input name="rideTarget" type="number" inputMode="numeric" defaultValue={15} min={1} max={999} required />
        </Field>
        <Field label="Pit stops" error={errors.pitTarget}>
          <Input name="pitTarget" type="number" inputMode="numeric" defaultValue={7} min={0} max={999} required />
        </Field>
        <Field label="Sport days" error={errors.sportTarget}>
          <Input name="sportTarget" type="number" inputMode="numeric" defaultValue={10} min={0} max={999} required />
        </Field>
      </div>

      <p className="text-sm text-subtle">
        Pit explorations count as rides too, so the pit target should be at or below the
        ride target.
      </p>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create mission"}
      </Button>
    </form>
  );
}
