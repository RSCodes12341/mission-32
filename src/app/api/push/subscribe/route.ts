import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/session";
import { pushSubscriptionSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  // Endpoint is unique across users: if a device is handed to someone else and
  // they subscribe, the row moves to them rather than colliding.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return NextResponse.json({ ok: true });
}
