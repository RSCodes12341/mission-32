import { NextResponse } from "next/server";

import { createMissionWithOwner } from "@/lib/mission";
import { getApiUser } from "@/lib/session";
import { createMissionSchema, fieldErrors } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = createMissionSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  if (parsed.data.pitTarget > parsed.data.rideTarget) {
    return NextResponse.json(
      { errors: { pitTarget: "Pit explorations are a subset of rides, so this can't exceed the ride target" } },
      { status: 400 },
    );
  }

  const mission = await createMissionWithOwner(user.id, parsed.data);

  return NextResponse.json(
    { mission: { id: mission.id, name: mission.name, inviteCode: mission.inviteCode } },
    { status: 201 },
  );
}
