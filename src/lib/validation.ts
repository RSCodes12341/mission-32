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

export const createMissionSchema = z.object({
  name: z.string().trim().min(1, "Give the mission a name").max(80).default("Mission 32"),
  rideTarget: z.coerce.number().int().min(1).max(999).default(15),
  pitTarget: z.coerce.number().int().min(0).max(999).default(7),
  sportTarget: z.coerce.number().int().min(0).max(999).default(10),
});

export const activityKindSchema = z.enum(["RIDE", "PIT", "SPORT"]);

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/** First error message for a field, for inline form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
