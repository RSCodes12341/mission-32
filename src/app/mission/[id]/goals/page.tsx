import { notFound, redirect } from "next/navigation";

import { PageTitle } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/session";

import { EditGoalsForm } from "./edit-goals-form";

export const metadata = { title: "What this counts · Mission 32" };
export const dynamic = "force-dynamic";

export default async function EditGoalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireMembership(id);

  const mission = await prisma.mission.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      createdById: true,
      goals: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          target: true,
          hue: true,
          countsTowardId: true,
          _count: { select: { activities: true } },
        },
      },
    },
  });

  if (!mission) notFound();
  // Removing a goal deletes everyone's sessions logged against it, so this stays
  // with whoever started the mission.
  if (mission.createdById !== user.id) redirect(`/mission/${id}`);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageTitle sub="Add, rename, retarget or remove. Everyone works through their own copy of whatever is here.">
        What {mission.name} counts
      </PageTitle>
      <EditGoalsForm missionId={mission.id} goals={mission.goals} />
    </div>
  );
}
