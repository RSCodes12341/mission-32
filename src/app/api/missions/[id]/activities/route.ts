import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";
import { getApiUser, isMember } from "@/lib/session";
import { uploadPhoto } from "@/lib/storage";
import { NOTE_MAX, PHOTO_MAX_BYTES, PHOTO_MIME } from "@/lib/validation";

export const runtime = "nodejs";
// Photos are uploaded before the row is written, so allow room for two of them.
export const maxDuration = 60;

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
  if (!PHOTO_MIME.includes(file.type.toLowerCase() as (typeof PHOTO_MIME)[number])) {
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

  // The goal must belong to this mission — otherwise a member could log against
  // some other group's goal by id.
  const goalId = String(form.get("goalId") ?? "");
  const goal = goalId
    ? await prisma.missionGoal.findFirst({
        where: { id: goalId, missionId },
        select: { id: true, name: true },
      })
    : null;
  if (!goal) return badRequest("goalId", "Pick what you did.");

  const rawNote = String(form.get("note") ?? "").trim();
  if (rawNote.length > NOTE_MAX) {
    return badRequest("note", `Keep the note under ${NOTE_MAX} characters.`);
  }

  // Who this counted for. Always includes the logger; extra names must be members
  // of this mission, so nobody can push entries onto a stranger.
  const requested = form.getAll("participantIds").map(String).filter(Boolean);
  const participantIds = [...new Set([user.id, ...requested])];

  if (participantIds.length > 1) {
    const members = await prisma.membership.findMany({
      where: { missionId, userId: { in: participantIds } },
      select: { userId: true },
    });
    if (members.length !== participantIds.length) {
      return badRequest("participantIds", "Everyone on a shared session has to be a member.");
    }
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
      goalId: goal.id,
      userId: user.id,
      note: rawNote || null,
      beforePhotoUrl,
      afterPhotoUrl,
      participants: { create: participantIds.map((userId) => ({ userId })) },
    },
    select: { id: true, createdAt: true },
  });

  // Tell the others. Failures are logged, not surfaced — the activity is already
  // saved and that is what the user asked for.
  const others = await prisma.membership.findMany({
    where: { missionId, userId: { not: user.id } },
    select: { userId: true },
  });

  const label = goal.name.toLowerCase();
  const shared = participantIds.filter((id) => id !== user.id);
  const sharedSet = new Set(shared);

  await Promise.all([
    sendPushToUsers(shared, {
      title: "Mission 32",
      body: `${user.name} logged ${label} for both of you`,
      url: `/mission/${missionId}`,
      tag: `mission-${missionId}`,
    }),
    sendPushToUsers(
      others.map((m) => m.userId).filter((id) => !sharedSet.has(id)),
      {
        title: "Mission 32",
        body: `${user.name} logged ${label}`,
        url: `/mission/${missionId}`,
        tag: `mission-${missionId}`,
      },
    ),
  ]).catch((err) => console.error("Push fan-out failed", err));

  revalidatePath(`/mission/${missionId}`);
  revalidatePath("/dashboard");

  return NextResponse.json({ activity }, { status: 201 });
}
