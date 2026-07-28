"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, Field, FormError, Input } from "@/components/ui";

export function JoinMissionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefilled = (params.get("code") ?? "").toUpperCase().slice(0, 6);

  const [code, setCode] = useState(prefilled);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const autoJoined = useRef(false);

  const join = useCallback(
    async (inviteCode: string) => {
      setPending(true);
      setErrors({});
      try {
        const res = await fetch("/api/missions/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrors(body.errors ?? { form: "Could not join. Try again." });
          return;
        }
        router.push(`/mission/${body.mission.id}`);
        router.refresh();
      } catch {
        setErrors({ form: "Could not reach the server. Check your connection." });
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  // Arriving from a /mission/join?code=XXXXXX invite link joins in one tap.
  useEffect(() => {
    if (autoJoined.current || prefilled.length !== 6) return;
    autoJoined.current = true;
    void join(prefilled);
  }, [prefilled, join]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void join(code);
      }}
      className="space-y-4"
    >
      <FormError>{errors.form}</FormError>

      <Field label="Invite code" error={errors.inviteCode}>
        <Input
          name="inviteCode"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="ABC123"
          required
          className="font-mono text-lg tracking-[0.3em]"
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending || code.length !== 6}>
        {pending ? "Joining…" : "Join mission"}
      </Button>
    </form>
  );
}
