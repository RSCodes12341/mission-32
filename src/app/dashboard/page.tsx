import Link from "next/link";

import { ButtonLink, Card, EmptyState, PageTitle, ProgressBar } from "@/components/ui";
import { InviteCode } from "@/components/invite-code";
import { listMissionsForUser, type MissionSummary } from "@/lib/mission";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Dashboard · Mission 32" };
export const dynamic = "force-dynamic";

function MissionCard({ mission }: { mission: MissionSummary }) {
  const left = mission.myTotal - mission.myDone;

  return (
    <Card className="overflow-hidden transition-colors hover:border-line-strong">
      {/* The whole block is the target, not just the title. Tapping a card that
          looks tappable has to work — this is the bug that made the app unusable
          on a phone. */}
      <Link
        href={`/mission/${mission.id}`}
        className="block px-4 pt-4 pb-3 transition-colors hover:bg-sunken/60"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{mission.name}</p>
            <p className="mt-0.5 text-sm text-muted">
              {mission._count.memberships}{" "}
              {mission._count.memberships === 1 ? "member" : "members"} ·{" "}
              {mission._count.activities}{" "}
              {mission._count.activities === 1 ? "session" : "sessions"} logged
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tabular text-2xl font-semibold leading-none">
              {mission.myDone}
              <span className="text-base font-normal text-subtle">/{mission.myTotal}</span>
            </p>
            <p className="mt-1 text-xs text-subtle">yours</p>
          </div>
        </div>

        <ProgressBar
          ratio={mission.myRatio}
          label={`Your progress: ${mission.myDone} of ${mission.myTotal}`}
          className="mt-3"
        />

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {mission.goals.map((g) => (
            <span key={g.id} className="text-xs text-muted">
              <span className="tabular font-medium text-fg">
                {g.count}/{g.target}
              </span>{" "}
              {g.name}
            </span>
          ))}
        </div>

        <p className="mt-2 text-sm font-medium text-accent-ink">
          {mission.complete
            ? "You've finished this one."
            : `${left} ${left === 1 ? "session" : "sessions"} to go →`}
        </p>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
        <InviteCode code={mission.inviteCode} />
        <ButtonLink href={`/mission/${mission.id}#log`} className="px-3 text-xs">
          Log
        </ButtonLink>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const missions = await listMissionsForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle sub={missions.length ? undefined : `Signed in as ${user.name}.`}>
          Your missions
        </PageTitle>
        <div className="flex gap-2">
          <ButtonLink href="/mission/new" variant={missions.length ? "secondary" : "primary"}>
            New mission
          </ButtonLink>
          <ButtonLink href="/mission/join" variant="secondary">
            Join
          </ButtonLink>
        </div>
      </div>

      {missions.length === 0 ? (
        <EmptyState
          title="Nothing on the go yet"
          action={<ButtonLink href="/mission/new">Start a mission</ButtonLink>}
        >
          Start one and share the invite code, or join a friend&rsquo;s with theirs. You
          each work through your own copy of the targets.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {missions.map((mission) => (
            <li key={mission.id}>
              <MissionCard mission={mission} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
