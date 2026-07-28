"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui";

export function SignOutButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-8 px-2.5"
      disabled={pending}
      onClick={() => start(() => signOutAction())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
