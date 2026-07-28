import { Card } from "@/components/ui";
import type { MissionMember } from "@/lib/mission";

export function MemberList({
  members,
  currentUserId,
}: {
  members: MissionMember[];
  currentUserId: string;
}) {
  // Busiest first, so the list reads as a standing rather than a roster.
  const ranked = [...members].sort((a, b) => {
    const total = (m: MissionMember) => m.tally.rides + m.tally.sports;
    return total(b) - total(a) || a.name.localeCompare(b.name);
  });

  return (
    <Card className="divide-y divide-line">
      {ranked.map((member) => (
        <div key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">
              {member.name}
              {member.id === currentUserId ? (
                <span className="ml-1.5 text-xs font-normal text-subtle">you</span>
              ) : null}
            </p>
            <p className="text-xs text-subtle">
              {member.isOwner ? "Started the mission" : "Member"}
            </p>
          </div>

          <dl className="tabular flex shrink-0 gap-4 text-right text-sm">
            <div>
              <dt className="text-xs text-subtle">Rides</dt>
              <dd className="font-medium text-ride">{member.tally.rides}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Pits</dt>
              <dd className="font-medium text-pit">{member.tally.pits}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Sport</dt>
              <dd className="font-medium text-sport">{member.tally.sports}</dd>
            </div>
          </dl>
        </div>
      ))}
    </Card>
  );
}
