import Link from "next/link";

import { ButtonLink, Card, EmptyState, PageTitle } from "@/components/ui";
import { InviteCode } from "@/components/invite-code";
import { listMissionsForUser } from "@/lib/mission";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Dashboard · Mission 32" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const missions = await listMissionsForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle sub={`Signed in as ${user.name}.`}>Your missions</PageTitle>
        <div className="flex gap-2">
          <ButtonLink href="/mission/new">New mission</ButtonLink>
          <ButtonLink href="/mission/join" variant="secondary">
            Join with a code
          </ButtonLink>
        </div>
      </div>

      {missions.length === 0 ? (
        <EmptyState title="No missions yet">
          Create one and share the invite code, or join a friend&rsquo;s with their code.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {missions.map((mission) => (
            <li key={mission.id}>
              <Card className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={`/mission/${mission.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {mission.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {mission._count.memberships}{" "}
                      {mission._count.memberships === 1 ? "member" : "members"} ·{" "}
                      {mission._count.activities}{" "}
                      {mission._count.activities === 1 ? "entry" : "entries"} ·{" "}
                      {mission.rideTarget} rides / {mission.pitTarget} pits /{" "}
                      {mission.sportTarget} sport days
                    </p>
                  </div>
                  <InviteCode code={mission.inviteCode} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
