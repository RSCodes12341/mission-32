import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Mission 32" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted">Sign in to log your next one.</p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <p className="text-sm text-muted">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-fg underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  );
}
