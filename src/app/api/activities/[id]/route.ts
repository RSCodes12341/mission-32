import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/session";

/** Delete an activity you logged yourself. Other members' entries are off limits. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const activity = await prisma.activity.findUnique({
    where: { id },
    select: { id: true, userId: true, missionId: true },
  });

  if (!activity || activity.userId !== user.id) {
    // Same response either way, so this can't be used to probe for ids.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.activity.delete({ where: { id } });

  revalidatePath(`/mission/${activity.missionId}`);
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true });
}
