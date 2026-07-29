export type InviteContext = {
  missionName: string;
  inviteCode: string;
  origin: string;
  goals: { name: string; target: number }[];
  memberCount: number;
  inviterName: string;
  /** Sessions the inviter has already logged, for the "I've started" angle. */
  inviterDone: number;
};

export function inviteLink(ctx: Pick<InviteContext, "origin" | "inviteCode">): string {
  return `${ctx.origin}/mission/join?code=${ctx.inviteCode}`;
}

/** "15 rides, 7 pit explorations and 10 sport days" */
export function goalSummary(goals: { name: string; target: number }[]): string {
  const parts = goals.map((g) => `${g.target} ${g.name.toLowerCase()}`);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Opening lines. Deliberately dry and a bit competitive rather than hyped —
 * these go to people who already know the sender, so ad-voice reads as a joke
 * at their expense. Each takes the mission's real numbers.
 */
export const HOOKS: Array<(c: InviteContext) => string> = [
  () => `Consider this your "stop talking about it and do it" invite.`,
  (c) => `${c.inviterName} started ${c.missionName}. You're invited to suffer along.`,
  (c) =>
    c.inviterDone > 0
      ? `${c.inviterName} has ${c.inviterDone} logged already. You'd be starting from zero — so did everyone.`
      : `${c.inviterName} is starting ${c.missionName} from zero. Good time to jump in.`,
  () =>
    `No app store, no subscription, no ads. Just a shared list and the mild shame of falling behind.`,
  (c) =>
    c.memberCount > 1
      ? `${c.memberCount} of us are already in on ${c.missionName}. Room for one more.`
      : `${c.inviterName} is putting ${c.missionName} together and wants you on it.`,
  (c) => `${c.inviterName} is doing ${c.missionName}. Reckon you can keep up?`,
];

export function buildInviteMessage(ctx: InviteContext, hookIndex = 0): string {
  const hook = HOOKS[((hookIndex % HOOKS.length) + HOOKS.length) % HOOKS.length](ctx);
  const summary = goalSummary(ctx.goals);

  return [
    hook,
    "",
    summary ? `${ctx.missionName} — ${summary}.` : `${ctx.missionName}.`,
    `You get your own copy of all of it — nobody finishes it for you. Do one together and it counts for both.`,
    "",
    `Join code: ${ctx.inviteCode}`,
    inviteLink(ctx),
  ].join("\n");
}
