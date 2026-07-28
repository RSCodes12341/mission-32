"use client";

import { useEffect, useRef, useState } from "react";

type Props = { code: string; withLink?: boolean };

/**
 * Copies the join deep link when it can, falling back to the bare code so the
 * button still does something useful without a secure context or clipboard API.
 */
export function InviteCode({ code, withLink = true }: Props) {
  const [copied, setCopied] = useState<null | "link" | "code">(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    const link = `${window.location.origin}/mission/join?code=${code}`;
    const text = withLink ? link : code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(withLink ? "link" : "code");
    } catch {
      setCopied(null);
      window.prompt("Copy this invite link:", text);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-md border border-line bg-sunken px-2 py-1 font-mono text-sm tracking-[0.2em]">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-md px-2 py-1 text-sm text-muted hover:bg-sunken hover:text-fg"
      >
        {copied ? "Copied" : withLink ? "Copy invite link" : "Copy"}
      </button>
    </div>
  );
}
