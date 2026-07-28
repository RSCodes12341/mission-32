import Link from "next/link";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent" />
          Mission 32
        </Link>

        {user ? (
          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
            <SignOutButton />
          </div>
        ) : (
          <Link href="/login" className="text-sm text-muted hover:text-fg">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
