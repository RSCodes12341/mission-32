"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, ButtonLink, FormError } from "@/components/ui";
import { GoalEditor, draftsToPayload, type DraftGoal } from "@/components/goal-editor";

type ExistingGoal = {
  id: string;
  name: string;
  target: number;
  hue: number;
  countsTowardId: string | null;
  _count: { activities: number };
};

export function EditGoalsForm({
  missionId,
  goals: initial,
}: {
  missionId: string;
  goals: ExistingGoal[];
}) {
  const router = useRouter();
  const [goals, setGoals] = useState<DraftGoal[]>(() =>
    initial.map((g) => ({
      key: g.id,
      name: g.name,
      target: g.target,
      hue: g.hue,
      countsTowardKey: g.countsTowardId,
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmNeeded, setConfirmNeeded] = useState(false);
  const [pending, setPending] = useState(false);

  async function save(confirmDelete: boolean) {
    setPending(true);
    setErrors({});

    try {
      const res = await fetch(`/api/missions/${missionId}/goals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: draftsToPayload(goals), confirmDelete }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 409 && body.needsConfirmation) {
        setConfirmNeeded(true);
        setErrors(body.errors ?? {});
        return;
      }
      if (!res.ok) {
        const raw: Record<string, string> = body.errors ?? {};
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
          flat[k.startsWith("goals") ? "goals" : k] = v;
        }
        setErrors(Object.keys(flat).length ? flat : { form: "Could not save." });
        return;
      }

      router.push(`/mission/${missionId}`);
      router.refresh();
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(false);
      }}
      className="space-y-5"
    >
      <FormError>{errors.form}</FormError>

      <GoalEditor
        goals={goals}
        onChange={(next) => {
          setGoals(next);
          setConfirmNeeded(false);
        }}
        errors={errors}
      />

      {confirmNeeded ? (
        <div className="space-y-3 rounded-lg border border-line bg-danger-soft px-3 py-3">
          <p className="text-sm text-danger">
            {errors.goals} This can&rsquo;t be undone.
          </p>
          <Button
            type="button"
            variant="danger"
            className="w-full"
            disabled={pending}
            onClick={() => void save(true)}
          >
            {pending ? "Removing…" : "Remove them anyway"}
          </Button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending || confirmNeeded}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <ButtonLink href={`/mission/${missionId}`} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
