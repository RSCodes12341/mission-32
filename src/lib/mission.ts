import { randomInt } from "crypto";

import { Prisma, type ActivityKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export type MissionInput = {
  name: string;
  rideTarget: number;
  pitTarget: number;
  sportTarget: number;
};

/**
 * Creates the mission and the creator's membership together, retrying if the
 * random invite code happens to collide with an existing one.
 */
export async function createMissionWithOwner(userId: string, input: MissionInput) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.mission.create({
        data: {
          ...input,
          inviteCode: generateInviteCode(),
          createdById: userId,
          memberships: { create: { userId } },
        },
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
          rideTarget: true,
          pitTarget: true,
          sportTarget: true,
          _count: { select: { memberships: true, activities: true } },
        },
      },
    },
  });
  return memberships.map((m) => m.mission);
}

export type Tally = { rides: number; pits: number; sports: number };

export function emptyTally(): Tally {
  return { rides: 0, pits: 0, sports: 0 };
}

/**
 * A pit exploration is a ride too, so it counts toward both. Sport days stand alone.
 */
export function addToTally(tally: Tally, kind: ActivityKind): Tally {
  if (kind === "SPORT") return { ...tally, sports: tally.sports + 1 };
  if (kind === "PIT") return { ...tally, rides: tally.rides + 1, pits: tally.pits + 1 };
  return { ...tally, rides: tally.rides + 1 };
}

export function tallyFrom(kinds: ActivityKind[]): Tally {
  return kinds.reduce(addToTally, emptyTally());
}

/** Full mission view: targets, members with their own counts, and the feed. */
export async function getMissionDetail(missionId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      rideTarget: true,
      pitTarget: true,
      sportTarget: true,
      createdById: true,
      createdAt: true,
      memberships: {
        orderBy: { joinedAt: "asc" },
        select: {
          joinedAt: true,
          user: { select: { id: true, name: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          kind: true,
          note: true,
          beforePhotoUrl: true,
          afterPhotoUrl: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!mission) return null;

  const total = tallyFrom(mission.activities.map((a) => a.kind));

  const perUser = new Map<string, Tally>();
  for (const activity of mission.activities) {
    const current = perUser.get(activity.user.id) ?? emptyTally();
    perUser.set(activity.user.id, addToTally(current, activity.kind));
  }

  const members = mission.memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    joinedAt: m.joinedAt,
    isOwner: m.user.id === mission.createdById,
    tally: perUser.get(m.user.id) ?? emptyTally(),
  }));

  return { ...mission, total, members };
}

export type MissionDetail = NonNullable<Awaited<ReturnType<typeof getMissionDetail>>>;
export type FeedActivity = MissionDetail["activities"][number];
export type MissionMember = MissionDetail["members"][number];
