import Link from "next/link";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeMenu } from "@/components/theme-menu";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="-mx-2 flex min-h-11 items-center gap-2 rounded-lg px-2 font-semibold tracking-tight transition-colors hover:bg-sunken"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent" />
          Mission 32
        </Link>

        <div className="flex items-center gap-0.5">
          {user ? (
            <>
              <span className="hidden px-1 text-sm text-muted sm:inline">{user.name}</span>
              <ThemeMenu />
              <SignOutButton />
            </>
          ) : (
            <>
              <ThemeMenu />
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-muted transition-colors hover:bg-sunken hover:text-fg"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
