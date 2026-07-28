import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/session";
import { fieldErrors, joinSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = joinSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const mission = await prisma.mission.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
    select: { id: true, name: true },
  });

  if (!mission) {
    return NextResponse.json(
      { errors: { inviteCode: "No mission with that code" } },
      { status: 404 },
    );
  }

  // Already a member is success, not an error — the deep link should be idempotent.
  await prisma.membership.upsert({
    where: { userId_missionId: { userId: user.id, missionId: mission.id } },
    create: { userId: user.id, missionId: mission.id },
    update: {},
  });

  return NextResponse.json({ mission }, { status: 200 });
}
