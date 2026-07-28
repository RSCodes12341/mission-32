import { notFound } from "next/navigation";
import Link from "next/link";

import { ActivityFeed } from "@/components/activity-feed";
import { InviteCode } from "@/components/invite-code";
import { LogForm } from "@/components/log-form";
import { MemberList } from "@/components/member-list";
import { NotificationsButton } from "@/components/notifications-button";
import { ProgressCard } from "@/components/progress-card";
import { KIND_META } from "@/components/activity-kind";
import { getMissionDetail } from "@/lib/mission";
import { requireMembership } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = await getMissionDetail(id);
  return { title: mission ? `${mission.name} · Mission 32` : "Mission 32" };
}

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireMembership(id);

  const mission = await getMissionDetail(id);
  if (!mission) notFound();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
            ← All missions
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{mission.name}</h1>
          <p className="text-sm text-muted">
            {mission.members.length}{" "}
            {mission.members.length === 1 ? "member" : "members"} ·{" "}
            {mission.activities.length}{" "}
            {mission.activities.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
          <InviteCode code={mission.inviteCode} />
          <NotificationsButton />
        </div>
      </header>

      <section aria-label="Progress" className="grid gap-3 sm:grid-cols-3">
        <ProgressCard
          label="Rides"
          hint="Pit explorations count here too"
          current={mission.total.rides}
          target={mission.rideTarget}
          barClass={KIND_META.RIDE.bar}
        />
        <ProgressCard
          label="Pit explorations"
          current={mission.total.pits}
          target={mission.pitTarget}
          barClass={KIND_META.PIT.bar}
        />
        <ProgressCard
          label="Sport days"
          current={mission.total.sports}
          target={mission.sportTarget}
          barClass={KIND_META.SPORT.bar}
        />
      </section>

      <section aria-label="Log an activity" className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Log something</h2>
        <LogForm missionId={mission.id} />
      </section>

      <section aria-label="Members" className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Who&rsquo;s doing what</h2>
        <MemberList members={mission.members} currentUserId={user.id} />
      </section>

      <section aria-label="Activity feed" className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Feed</h2>
        <ActivityFeed activities={mission.activities} currentUserId={user.id} />
      </section>
    </div>
  );
}
