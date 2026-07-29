"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Field, FormError, Input } from "@/components/ui";
import { GoalEditor, draftsToPayload, type DraftGoal } from "@/components/goal-editor";

const PRESETS: { id: string; label: string; name: string; goals: Omit<DraftGoal, "key">[] }[] = [
  {
    id: "m32",
    label: "Mission 32",
    name: "Mission 32",
    goals: [
      { name: "Rides", target: 15, hue: 255, countsTowardKey: null },
      { name: "Pit explorations", target: 7, hue: 78, countsTowardKey: "RIDES" },
      { name: "Sport days", target: 10, hue: 300, countsTowardKey: null },
    ],
  },
  {
    id: "blank",
    label: "Start from scratch",
    name: "",
    goals: [{ name: "", target: 10, hue: 255, countsTowardKey: null }],
  },
];

function buildPreset(id: string): { name: string; goals: DraftGoal[] } {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
  const keys = preset.goals.map(() => Math.random().toString(36).slice(2));
  const goals = preset.goals.map((g, i) => ({
    ...g,
    key: keys[i],
    // The sentinel points at the first goal; resolve it now that keys exist.
    countsTowardKey: g.countsTowardKey === "RIDES" ? keys[0] : null,
  }));
  return { name: preset.name, goals };
}

export function NewMissionForm() {
  const router = useRouter();
  const initial = buildPreset("m32");

  const [preset, setPreset] = useState("m32");
  const [name, setName] = useState(initial.name);
  const [goals, setGoals] = useState<DraftGoal[]>(initial.goals);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function choosePreset(id: string) {
    const next = buildPreset(id);
    setPreset(id);
    setName(next.name);
    setGoals(next.goals);
    setErrors({});
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, goals: draftsToPayload(goals) }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Zod paths come back as goals.0.name — surface them on the goals block.
        const raw: Record<string, string> = body.errors ?? {};
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
          flat[k.startsWith("goals") ? "goals" : k] = v;
        }
        setErrors(Object.keys(flat).length ? flat : { form: "Could not create the mission." });
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
    <form onSubmit={onSubmit} className="space-y-5">
      <FormError>{errors.form}</FormError>

      <div
        role="radiogroup"
        aria-label="Starting point"
        className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-sunken p-1"
      >
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={preset === p.id}
            onClick={() => choosePreset(p.id)}
            className={`min-h-10 rounded-md text-sm font-medium transition-colors ${
              preset === p.id
                ? "bg-surface text-fg shadow-[0_0_0_1px_var(--line)]"
                : "text-muted hover:text-fg"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Field label="Mission name" error={errors.name}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder="What are you calling it?"
        />
      </Field>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">What are you counting?</p>
          <p className="text-sm text-muted">
            Anything you like. Everyone works through their own copy of these.
          </p>
        </div>
        <GoalEditor goals={goals} onChange={setGoals} errors={errors} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create mission"}
      </Button>
    </form>
  );
}
