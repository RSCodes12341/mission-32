import { z } from "zod";

export const NOTE_MAX = 280;
export const PHOTO_MAX_BYTES = 8 * 1024 * 1024; // 8MB
export const PHOTO_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const GOAL_NAME_MAX = 40;
export const MAX_GOALS = 12;

/** Distinct, evenly-spread hues so a new goal never looks like the one above it. */
export const GOAL_HUES = [255, 78, 300, 150, 27, 195, 328, 105, 230, 55, 275, 170];

export function nextGoalHue(usedHues: number[]): number {
  return GOAL_HUES.find((h) => !usedHues.includes(h)) ?? GOAL_HUES[usedHues.length % GOAL_HUES.length];
}

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Add your name").max(60, "Name is too long"),
  email: z.string().trim().toLowerCase().email("That doesn't look like an email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const joinSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "Invite codes are 6 letters or numbers"),
});

export const goalInputSchema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(GOAL_NAME_MAX, "That name is too long"),
  target: z.coerce.number().int().min(1, "Target must be at least 1").max(999, "That target is too high"),
  hue: z.coerce.number().int().min(0).max(360).optional(),
  /** Index into the same goals array — this goal also advances that one. */
  countsTowardIndex: z.coerce.number().int().min(0).optional().nullable(),
});

export type GoalInput = z.infer<typeof goalInputSchema>;

export const createMissionSchema = z.object({
  name: z.string().trim().min(1, "Give the mission a name").max(80),
  goals: z
    .array(goalInputSchema)
    .min(1, "A mission needs at least one thing to count")
    .max(MAX_GOALS, `That's more than ${MAX_GOALS} goals`),
});

export const updateGoalsSchema = z.object({
  goals: z.array(goalInputSchema).min(1, "Keep at least one goal").max(MAX_GOALS),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/** The mission this app was built for, offered as the starting point. */
export const DEFAULT_GOALS: GoalInput[] = [
  { name: "Rides", target: 15, hue: 255 },
  { name: "Pit explorations", target: 7, hue: 78, countsTowardIndex: 0 },
  { name: "Sport days", target: 10, hue: 300 },
];

/** Rejects self-references and chains — roll-up is one level deep by design. */
export function validateGoalGraph(goals: GoalInput[]): string | null {
  const names = goals.map((g) => g.name.toLowerCase());
  if (new Set(names).size !== names.length) return "Two goals can't share a name";

  for (const [i, goal] of goals.entries()) {
    const idx = goal.countsTowardIndex;
    if (idx === undefined || idx === null) continue;
    if (idx === i) return "A goal can't count toward itself";
    if (idx < 0 || idx >= goals.length) return "That roll-up target doesn't exist";
    const parent = goals[idx];
    if (parent.countsTowardIndex !== undefined && parent.countsTowardIndex !== null) {
      return "Roll-ups only go one level deep";
    }
    if (goal.target > parent.target) {
      return `"${goal.name}" can't exceed "${parent.name}", since each one counts toward it`;
    }
  }
  return null;
}

/** First error message per field, for inline form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
