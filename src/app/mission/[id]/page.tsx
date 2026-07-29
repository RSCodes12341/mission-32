import { notFound } from "next/navigation";
import Link from "next/link";

import { ActivityFeed } from "@/components/activity-feed";
import { InviteCode } from "@/components/invite-code";
import { LogForm } from "@/components/log-form";
import { MemberList } from "@/components/member-list";
import { NotificationsButton } from "@/components/notifications-button";
import { Card, ProgressBar, SectionTitle, cx, goalStyle } from "@/components/ui";
import { getMissionDetail } from "@/lib/mission";
import { requireMembership } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = await getMissionDetail(id, "");
  return { title: mission ? `${mission.name} · Mission 32` : "Mission 32" };
}

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireMembership(id);

  const mission = await getMissionDetail(id, user.id);
  if (!mission) notFound();

  const left = mission.myTotal - mission.myDone;
  const isOwner = mission.createdById === user.id;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/dashboard"
          className="-mx-2 inline-flex min-h-9 items-center rounded-lg px-2 text-sm text-muted transition-colors hover:bg-sunken hover:text-fg"
        >
          ← All missions
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{mission.name}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {mission.members.length}{" "}
              {mission.members.length === 1 ? "person" : "people"}, each working through
              their own {mission.myTotal}
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
            <InviteCode code={mission.inviteCode} />
            <NotificationsButton />
          </div>
        </div>
      </header>

      {/* Your progress is the hero — the group standing lives further down. */}
      <section aria-label="Your progress">
        <Card className="px-4 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Your progress</p>
              <p className="tabular mt-1 text-4xl font-semibold leading-none">
                {mission.myDone}
                <span className="text-xl font-normal text-subtle">/{mission.myTotal}</span>
              </p>
            </div>
            <p className="pb-1 text-sm text-muted">
              {mission.iAmComplete ? (
                <span className="font-medium text-accent-ink">All done.</span>
              ) : (
                <>
                  <span className="tabular font-semibold text-fg">{left}</span> to go
                </>
              )}
            </p>
          </div>

          <ProgressBar
            ratio={mission.myRatio}
            label={`Your overall progress: ${mission.myDone} of ${mission.myTotal}`}
            className="mt-3 h-2"
          />

          <ul className="mt-5 space-y-3.5">
            {mission.myProgress.map((goal) => (
              <li key={goal.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium" style={goalStyle(goal.hue)}>
                    <span className="goal-ink">{goal.name}</span>
                    {goal.rollsUpInto ? (
                      <span className="ml-1.5 text-xs font-normal text-subtle">
                        also counts as {goal.rollsUpInto.toLowerCase()}
                      </span>
                    ) : null}
                  </p>
                  <p className="tabular shrink-0 text-sm">
                    <span className={cx("font-semibold", goal.done && "text-accent-ink")}>
                      {goal.count}
                    </span>
                    <span className="text-subtle">/{goal.target}</span>
                  </p>
                </div>
                <ProgressBar
                  ratio={goal.ratio}
                  hue={goal.hue}
                  label={`${goal.name}: ${goal.count} of ${goal.target}`}
                  className="mt-1.5"
                />
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section id="log" aria-label="Log a session" className="scroll-mt-20 space-y-3">
        <SectionTitle>Log something</SectionTitle>
        <LogForm
          missionId={mission.id}
          currentUserId={user.id}
          goals={mission.myProgress.map((g) => ({
            id: g.id,
            name: g.name,
            hue: g.hue,
            remaining: g.remaining,
          }))}
          members={mission.members.map((m) => ({ id: m.id, name: m.name }))}
        />
      </section>

      <section aria-label="Everyone" className="space-y-3">
        <SectionTitle
          aside={
            mission.membersComplete > 0 ? (
              <span className="text-sm text-muted">
                {mission.membersComplete} finished
              </span>
            ) : null
          }
        >
          Everyone
        </SectionTitle>
        <MemberList members={mission.members} />
      </section>

      <section aria-label="Activity feed" className="space-y-3">
        <SectionTitle
          aside={
            <span className="text-sm text-muted">
              {mission.activities.length}{" "}
              {mission.activities.length === 1 ? "session" : "sessions"}
            </span>
          }
        >
          Feed
        </SectionTitle>
        <ActivityFeed activities={mission.activities} currentUserId={user.id} />
      </section>

      {isOwner ? (
        <section aria-label="Mission settings">
          <Link
            href={`/mission/${mission.id}/goals`}
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-muted transition-colors hover:bg-sunken hover:text-fg"
          >
            Change what this mission counts →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
