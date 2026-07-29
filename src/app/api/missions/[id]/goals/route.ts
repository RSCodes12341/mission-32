import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/session";
import {
  fieldErrors,
  nextGoalHue,
  updateGoalsSchema,
  validateGoalGraph,
} from "@/lib/validation";

/**
 * Replaces a mission's goals. Sent as the whole list rather than per-goal edits,
 * so reordering, renaming, adding and removing are one atomic operation.
 *
 * Only the mission's creator can do this: removing a goal deletes every session
 * logged against it, for everyone.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: missionId } = await params;

  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      createdById: true,
      goals: {
        orderBy: { position: "asc" },
        select: { id: true, name: true, _count: { select: { activities: true } } },
      },
    },
  });
  if (!mission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (mission.createdById !== user.id) {
    return NextResponse.json(
      { errors: { form: "Only whoever started the mission can change what it counts." } },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateGoalsSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const graphError = validateGoalGraph(parsed.data.goals);
  if (graphError) return NextResponse.json({ errors: { goals: graphError } }, { status: 400 });

  // Match incoming goals to existing rows by name so renames-in-place keep history.
  const incomingNames = new Set(parsed.data.goals.map((g) => g.name.toLowerCase()));
  const removed = mission.goals.filter((g) => !incomingNames.has(g.name.toLowerCase()));
  const losing = removed.filter((g) => g._count.activities > 0);

  if (losing.length > 0 && body?.confirmDelete !== true) {
    return NextResponse.json(
      {
        needsConfirmation: true,
        errors: {
          goals: `Removing ${losing
            .map((g) => `"${g.name}"`)
            .join(" and ")} would delete ${losing.reduce(
            (n, g) => n + g._count.activities,
            0,
          )} logged ${
            losing.reduce((n, g) => n + g._count.activities, 0) === 1 ? "session" : "sessions"
          }, including other people's.`,
        },
      },
      { status: 409 },
    );
  }

  const existingByName = new Map(mission.goals.map((g) => [g.name.toLowerCase(), g]));

  await prisma.$transaction(async (tx) => {
    if (removed.length > 0) {
      await tx.missionGoal.deleteMany({ where: { id: { in: removed.map((g) => g.id) } } });
    }

    const used: number[] = [];
    const ids: string[] = [];

    for (const [i, goal] of parsed.data.goals.entries()) {
      const hue = goal.hue ?? nextGoalHue(used);
      used.push(hue);
      const existing = existingByName.get(goal.name.toLowerCase());

      if (existing) {
        await tx.missionGoal.update({
          where: { id: existing.id },
          data: { name: goal.name, target: goal.target, hue, position: i, countsTowardId: null },
        });
        ids.push(existing.id);
      } else {
        const created = await tx.missionGoal.create({
          data: { missionId, name: goal.name, target: goal.target, hue, position: i },
          select: { id: true },
        });
        ids.push(created.id);
      }
    }

    // Second pass: roll-ups reference sibling ids that only exist after pass one.
    for (const [i, goal] of parsed.data.goals.entries()) {
      const idx = goal.countsTowardIndex;
      if (idx === undefined || idx === null) continue;
      await tx.missionGoal.update({
        where: { id: ids[i] },
        data: { countsTowardId: ids[idx] },
      });
    }
  });

  revalidatePath(`/mission/${missionId}`);
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true });
}
