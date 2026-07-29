import { randomInt } from "crypto";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GoalInput } from "@/lib/validation";

// No 0/O/1/I so a code read aloud or copied by hand is unambiguous.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Creates the mission, its goals, and the creator's membership together,
 * retrying if the random invite code collides. Goals are inserted in two passes
 * because `countsToward` references sibling rows that don't exist until the
 * first pass commits.
 */
export async function createMissionWithOwner(
  userId: string,
  name: string,
  goals: GoalInput[],
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const mission = await tx.mission.create({
          data: {
            name,
            inviteCode: generateInviteCode(),
            createdById: userId,
            memberships: { create: { userId } },
            goals: {
              create: goals.map((g, i) => ({
                name: g.name,
                target: g.target,
                hue: g.hue ?? 255,
                position: i,
              })),
            },
          },
          include: { goals: { orderBy: { position: "asc" } } },
        });

        for (const [i, goal] of goals.entries()) {
          const idx = goal.countsTowardIndex;
          if (idx === undefined || idx === null) continue;
          await tx.missionGoal.update({
            where: { id: mission.goals[i].id },
            data: { countsTowardId: mission.goals[idx].id },
          });
        }

        return mission;
      });
    } catch (err) {
      const collision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target ?? "").includes("inviteCode");
      if (!collision) throw err;
    }
  }
  throw new Error("Could not allocate a unique invite code");
}

type GoalRow = { id: string; countsTowardId: string | null };

/**
 * goalId -> every goal id that advances it. A goal always advances itself, plus
 * anything that rolls up into it (a pit exploration is a ride too).
 */
export function contributorMap(goals: GoalRow[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const g of goals) map.set(g.id, new Set([g.id]));
  for (const g of goals) {
    if (g.countsTowardId) map.get(g.countsTowardId)?.add(g.id);
  }
  return map;
}

export type GoalProgress = {
  id: string;
  name: string;
  target: number;
  hue: number;
  count: number;
  remaining: number;
  done: boolean;
  ratio: number;
  rollsUpInto: string | null;
};

/**
 * Everything the mission page needs: the viewer's own progress, every member's
 * progress against the same goals, and the shared feed. Targets are per person —
 * each member completes their own copy of the mission.
 */
export async function getMissionDetail(missionId: string, viewerId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      createdById: true,
      createdAt: true,
      goals: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          target: true,
          hue: true,
          position: true,
          countsTowardId: true,
        },
      },
      memberships: {
        orderBy: { joinedAt: "asc" },
        select: { joinedAt: true, user: { select: { id: true, name: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          note: true,
          beforePhotoUrl: true,
          afterPhotoUrl: true,
          createdAt: true,
          userId: true,
          goalId: true,
          goal: { select: { id: true, name: true, hue: true } },
          user: { select: { id: true, name: true } },
          participants: { select: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!mission) return null;

  const contributors = contributorMap(mission.goals);
  const goalName = new Map(mission.goals.map((g) => [g.id, g.name]));

  // userId -> goalId -> raw count of activities logged directly against that goal.
  const raw = new Map<string, Map<string, number>>();
  for (const activity of mission.activities) {
    for (const { user } of activity.participants) {
      const byGoal = raw.get(user.id) ?? new Map<string, number>();
      byGoal.set(activity.goalId, (byGoal.get(activity.goalId) ?? 0) + 1);
      raw.set(user.id, byGoal);
    }
  }

  const progressFor = (userId: string): GoalProgress[] =>
    mission.goals.map((goal) => {
      const byGoal = raw.get(userId);
      let count = 0;
      for (const contributorId of contributors.get(goal.id) ?? []) {
        count += byGoal?.get(contributorId) ?? 0;
      }
      return {
        id: goal.id,
        name: goal.name,
        target: goal.target,
        hue: goal.hue,
        count,
        remaining: Math.max(0, goal.target - count),
        done: count >= goal.target,
        ratio: goal.target > 0 ? Math.min(1, count / goal.target) : 1,
        rollsUpInto: goal.countsTowardId ? (goalName.get(goal.countsTowardId) ?? null) : null,
      };
    });

  const overall = (progress: GoalProgress[]) => {
    const target = progress.reduce((n, g) => n + g.target, 0);
    const done = progress.reduce((n, g) => n + Math.min(g.count, g.target), 0);
    return { done, target, ratio: target > 0 ? done / target : 1 };
  };

  const members = mission.memberships.map((m) => {
    const progress = progressFor(m.user.id);
    const o = overall(progress);
    return {
      id: m.user.id,
      name: m.user.name,
      joinedAt: m.joinedAt,
      isOwner: m.user.id === mission.createdById,
      isViewer: m.user.id === viewerId,
      progress,
      done: o.done,
      total: o.target,
      ratio: o.ratio,
      complete: progress.every((g) => g.done),
    };
  });

  const myProgress = progressFor(viewerId);
  const mine = overall(myProgress);

  return {
    ...mission,
    myProgress,
    myDone: mine.done,
    myTotal: mine.target,
    myRatio: mine.ratio,
    iAmComplete: myProgress.every((g) => g.done),
    members,
    membersComplete: members.filter((m) => m.complete).length,
  };
}

/** Dashboard rows: each mission plus the viewer's own headline progress. */
export async function listMissionsForUser(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: {
      mission: {
        select: {
          id: true,
          name: true,
          inviteCode: true,
          _count: { select: { memberships: true, activities: true } },
          goals: {
            orderBy: { position: "asc" },
            select: { id: true, name: true, target: true, hue: true, countsTowardId: true },
          },
          activities: {
            where: { participants: { some: { userId } } },
            select: { goalId: true },
          },
        },
      },
    },
  });

  return memberships.map(({ mission }) => {
    const { activities, goals, ...rest } = mission;
    const contributors = contributorMap(goals);

    const counted = new Map<string, number>();
    for (const a of activities) counted.set(a.goalId, (counted.get(a.goalId) ?? 0) + 1);

    const progress = goals.map((goal) => {
      let count = 0;
      for (const id of contributors.get(goal.id) ?? []) count += counted.get(id) ?? 0;
      return { ...goal, count, done: count >= goal.target };
    });

    const target = progress.reduce((n, g) => n + g.target, 0);
    const done = progress.reduce((n, g) => n + Math.min(g.count, g.target), 0);

    return {
      ...rest,
      goals: progress,
      myDone: done,
      myTotal: target,
      myRatio: target > 0 ? done / target : 1,
      complete: progress.every((g) => g.done),
    };
  });
}

export type MissionDetail = NonNullable<Awaited<ReturnType<typeof getMissionDetail>>>;
export type FeedActivity = MissionDetail["activities"][number];
export type MissionMember = MissionDetail["members"][number];
export type MissionSummary = Awaited<ReturnType<typeof listMissionsForUser>>[number];
