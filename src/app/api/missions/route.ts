import { NextResponse } from "next/server";

import { createMissionWithOwner } from "@/lib/mission";
import { getApiUser } from "@/lib/session";
import {
  createMissionSchema,
  fieldErrors,
  nextGoalHue,
  validateGoalGraph,
} from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = createMissionSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const graphError = validateGoalGraph(parsed.data.goals);
  if (graphError) {
    return NextResponse.json({ errors: { goals: graphError } }, { status: 400 });
  }

  // Fill in any hues the client didn't pick, keeping them distinct.
  const used: number[] = [];
  const goals = parsed.data.goals.map((g) => {
    const hue = g.hue ?? nextGoalHue(used);
    used.push(hue);
    return { ...g, hue };
  });

  const mission = await createMissionWithOwner(user.id, parsed.data.name, goals);

  return NextResponse.json(
    { mission: { id: mission.id, name: mission.name, inviteCode: mission.inviteCode } },
    { status: 201 },
  );
}
