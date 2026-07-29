import { Card, ProgressBar, cx } from "@/components/ui";
import type { MissionMember } from "@/lib/mission";

export function MemberList({ members }: { members: MissionMember[] }) {
  // Furthest along first — everyone runs the same targets, so this is a standing.
  const ranked = [...members].sort(
    (a, b) => b.done - a.done || a.name.localeCompare(b.name),
  );

  return (
    <Card className="divide-y divide-line">
      {ranked.map((member) => (
        <div key={member.id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate font-medium">
              {member.name}
              {member.isViewer ? (
                <span className="ml-1.5 text-xs font-normal text-subtle">you</span>
              ) : null}
              {member.isOwner ? (
                <span className="ml-1.5 text-xs font-normal text-subtle">· started it</span>
              ) : null}
            </p>

            <p className="tabular shrink-0 text-sm">
              {member.complete ? (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
                  Finished
                </span>
              ) : (
                <>
                  <span className="font-semibold">{member.done}</span>
                  <span className="text-subtle">/{member.total}</span>
                </>
              )}
            </p>
          </div>

          <ProgressBar
            ratio={member.ratio}
            label={`${member.name}: ${member.done} of ${member.total}`}
            className={cx("mt-2", member.isViewer ? "" : "opacity-80")}
          />

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
            {member.progress.map((g) => (
              <span key={g.id} className="text-xs text-muted">
                <span className="tabular font-medium text-fg">
                  {g.count}/{g.target}
                </span>{" "}
                {g.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}
