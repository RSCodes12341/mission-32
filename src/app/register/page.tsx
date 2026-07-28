import Link from "next/link";
import { Suspense } from "react";

import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account · September Mission" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted">
          Then create a mission or join one with an invite code.
        </p>
      </div>

      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>

      <p className="text-sm text-muted">
        Already signed up?{" "}
        <Link href="/login" className="font-medium text-fg underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
