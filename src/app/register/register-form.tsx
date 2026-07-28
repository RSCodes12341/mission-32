"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, Field, FormError, Input } from "@/components/ui";

type Errors = Record<string, string>;

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors ?? { form: "Could not create your account. Try again." });
        return;
      }

      // Account exists — sign straight in rather than making them retype it.
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError>{errors.form}</FormError>

      <Field label="Name" error={errors.name}>
        <Input name="name" autoComplete="name" required placeholder="How you show up in the feed" />
      </Field>

      <Field label="Email" error={errors.email}>
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>

      <Field
        label="Password"
        error={errors.password}
        hint="At least 8 characters."
      >
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
