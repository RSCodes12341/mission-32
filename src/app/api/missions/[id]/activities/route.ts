import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";
import { getApiUser, isMember } from "@/lib/session";
import { uploadPhoto } from "@/lib/storage";
import {
  activityKindSchema,
  NOTE_MAX,
  PHOTO_MAX_BYTES,
  PHOTO_MIME,
} from "@/lib/validation";

export const runtime = "nodejs";
// Photos are uploaded before the row is written, so allow room for two of them.
export const maxDuration = 60;

const KIND_LABEL = { RIDE: "ride", PIT: "pit exploration", SPORT: "sport day" } as const;

function badRequest(field: string, message: string) {
  return NextResponse.json({ errors: { [field]: message } }, { status: 400 });
}

/** Returns the file if one was actually attached, else null. */
function filePart(form: FormData, key: string): File | null {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

function validatePhoto(file: File, field: string) {
  if (file.size > PHOTO_MAX_BYTES) {
    return badRequest(field, "That photo is over 8MB — pick a smaller one.");
  }
  const type = file.type.toLowerCase();
  if (!PHOTO_MIME.includes(type as (typeof PHOTO_MIME)[number])) {
    return badRequest(field, "Only jpg, png, webp or heic photos.");
  }
  return null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: missionId } = await params;

  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await isMember(user.id, missionId))) {
    return NextResponse.json({ error: "Not a member of this mission" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("form", "Could not read the upload.");

  const kind = activityKindSchema.safeParse(form.get("kind"));
  if (!kind.success) return badRequest("kind", "Pick ride, pit exploration or sport day.");

  const rawNote = String(form.get("note") ?? "").trim();
  if (rawNote.length > NOTE_MAX) {
    return badRequest("note", `Keep the note under ${NOTE_MAX} characters.`);
  }

  const before = filePart(form, "beforePhoto");
  const after = filePart(form, "afterPhoto");

  for (const [file, field] of [
    [before, "beforePhoto"],
    [after, "afterPhoto"],
  ] as const) {
    if (!file) continue;
    const problem = validatePhoto(file, field);
    if (problem) return problem;
  }

  let beforePhotoUrl: string | null = null;
  let afterPhotoUrl: string | null = null;
  try {
    [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
      before ? uploadPhoto(before, `${missionId}-before`) : Promise.resolve(null),
      after ? uploadPhoto(after, `${missionId}-after`) : Promise.resolve(null),
    ]);
  } catch (err) {
    console.error("Photo upload failed", err);
    return NextResponse.json(
      { errors: { form: "The photo upload failed. Try again." } },
      { status: 502 },
    );
  }

  const activity = await prisma.activity.create({
    data: {
      missionId,
      userId: user.id,
      kind: kind.data,
      note: rawNote || null,
      beforePhotoUrl,
      afterPhotoUrl,
    },
    select: { id: true, kind: true, createdAt: true },
  });

  // Tell everyone else in the mission. Failures here are logged, not surfaced —
  // the activity is already saved and that is what the user asked for.
  const others = await prisma.membership.findMany({
    where: { missionId, userId: { not: user.id } },
    select: { userId: true },
  });
  await sendPushToUsers(
    others.map((m) => m.userId),
    {
      title: "September Mission",
      body: `${user.name} logged a ${KIND_LABEL[kind.data]}`,
      url: `/mission/${missionId}`,
      tag: `mission-${missionId}`,
    },
  ).catch((err) => console.error("Push fan-out failed", err));

  revalidatePath(`/mission/${missionId}`);
  revalidatePath("/dashboard");

  return NextResponse.json({ activity }, { status: 201 });
}
