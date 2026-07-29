"use client";

import { Button, Input, cx, goalStyle } from "@/components/ui";
import { GOAL_HUES, GOAL_NAME_MAX, MAX_GOALS } from "@/lib/validation";

export type DraftGoal = {
  key: string;
  name: string;
  target: number | string;
  hue: number;
  countsTowardKey: string | null;
};

export function newDraft(used: number[] = []): DraftGoal {
  const hue = GOAL_HUES.find((h) => !used.includes(h)) ?? GOAL_HUES[used.length % GOAL_HUES.length];
  return {
    key: Math.random().toString(36).slice(2),
    name: "",
    target: 10,
    hue,
    countsTowardKey: null,
  };
}

/**
 * Editing surface for "what does this mission count". Deliberately a plain list
 * of rows rather than a modal flow — adding and removing needs to be cheap.
 */
export function GoalEditor({
  goals,
  onChange,
  errors,
}: {
  goals: DraftGoal[];
  onChange: (next: DraftGoal[]) => void;
  errors?: Record<string, string>;
}) {
  const update = (key: string, patch: Partial<DraftGoal>) =>
    onChange(goals.map((g) => (g.key === key ? { ...g, ...patch } : g)));

  const remove = (key: string) =>
    onChange(
      goals
        .filter((g) => g.key !== key)
        // Anything that rolled up into the removed goal becomes standalone.
        .map((g) => (g.countsTowardKey === key ? { ...g, countsTowardKey: null } : g)),
    );

  const total = goals.reduce((n, g) => n + (Number(g.target) || 0), 0);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {goals.map((goal) => {
          // Only goals that aren't themselves rolling up can be a roll-up target,
          // which keeps the graph one level deep.
          const parents = goals.filter(
            (g) => g.key !== goal.key && !g.countsTowardKey,
          );

          return (
            <li
              key={goal.key}
              style={goalStyle(goal.hue)}
              className="rounded-lg border border-line bg-surface p-3"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      aria-label="What to count"
                      value={goal.name}
                      maxLength={GOAL_NAME_MAX}
                      placeholder="Rides, climbs, sauna…"
                      onChange={(e) => update(goal.key, { name: e.target.value })}
                    />
                    <Input
                      aria-label={`Target for ${goal.name || "this goal"}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={999}
                      value={goal.target}
                      onChange={(e) => update(goal.key, { target: e.target.value })}
                      className="w-20 shrink-0 text-center"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1">
                      {GOAL_HUES.slice(0, 6).map((h) => (
                        <button
                          key={h}
                          type="button"
                          aria-label={`Colour ${h}`}
                          aria-pressed={goal.hue === h}
                          onClick={() => update(goal.key, { hue: h })}
                          className={cx(
                            "h-6 w-6 rounded-full border transition-transform hover:scale-110",
                            goal.hue === h ? "border-fg" : "border-transparent",
                          )}
                          style={{ background: `oklch(var(--goal-l) var(--goal-c) ${h})` }}
                        />
                      ))}
                    </div>

                    {parents.length > 0 ? (
                      <label className="flex items-center gap-1.5 text-xs text-muted">
                        also counts as
                        <select
                          value={goal.countsTowardKey ?? ""}
                          onChange={(e) =>
                            update(goal.key, { countsTowardKey: e.target.value || null })
                          }
                          className="min-h-9 rounded-md border border-line bg-surface px-2 text-xs text-fg"
                        >
                          <option value="">nothing</option>
                          {parents.map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.name || "unnamed"}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(goal.key)}
                  disabled={goals.length === 1}
                  aria-label={`Remove ${goal.name || "this goal"}`}
                  className="min-h-11 shrink-0 rounded-lg px-2.5 text-sm text-subtle transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {errors?.goals ? <p className="text-sm text-danger">{errors.goals}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={goals.length >= MAX_GOALS}
          onClick={() => onChange([...goals, newDraft(goals.map((g) => g.hue))])}
        >
          Add something to count
        </Button>
        <p className="tabular text-sm text-muted">
          {total} {total === 1 ? "session" : "sessions"} each
        </p>
      </div>
    </div>
  );
}

/** Maps editor rows to the API's index-based roll-up references. */
export function draftsToPayload(goals: DraftGoal[]) {
  return goals.map((g) => ({
    name: g.name.trim(),
    target: Number(g.target) || 0,
    hue: g.hue,
    countsTowardIndex: g.countsTowardKey
      ? goals.findIndex((x) => x.key === g.countsTowardKey)
      : null,
  }));
}
