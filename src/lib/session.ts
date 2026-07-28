import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = { id: string; name: string };

/** Session user, or a redirect to /login. Use at the top of protected pages. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return { id: session.user.id, name: session.user.name ?? "Someone" };
}

/** Session user for API routes — returns null instead of redirecting. */
export async function getApiUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name ?? "Someone" };
}

/**
 * Every mission-scoped page goes through here. No Membership row means the
 * mission is not yours to see — bounce to join rather than leaking that it exists.
 */
export async function requireMembership(missionId: string): Promise<SessionUser> {
  const user = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_missionId: { userId: user.id, missionId } },
    select: { id: true },
  });
  if (!membership) redirect("/mission/join");
  return user;
}

export async function isMember(userId: string, missionId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: { userId_missionId: { userId, missionId } },
    select: { id: true },
  });
  return Boolean(membership);
}
