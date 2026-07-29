"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button, cx } from "@/components/ui";
import { HOOKS, buildInviteMessage, inviteLink, type InviteContext } from "@/lib/invite";
import { useDismissable } from "@/lib/use-dismissable";

type Props = {
  code: string;
  missionName: string;
  goals: { name: string; target: number }[];
  memberCount: number;
  inviterName: string;
  inviterDone: number;
  /** Compact renders just the code plus a Share button, for dashboard rows. */
  compact?: boolean;
};

type Copied = null | "message" | "code" | "link";

export function InviteCode({
  code,
  missionName,
  goals,
  memberCount,
  inviterName,
  inviterDone,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hook, setHook] = useState(0);
  const [copied, setCopied] = useState<Copied>(null);
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
    // Start on a random hook so two people inviting on the same day don't send
    // word-for-word identical messages.
    setHook(Math.floor(Math.random() * HOOKS.length));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useDismissable(wrapRef, open, useCallback(() => setOpen(false), []));

  const ctx: InviteContext = {
    missionName,
    inviteCode: code,
    origin,
    goals,
    memberCount,
    inviterName,
    inviterDone,
  };
  const message = origin ? buildInviteMessage(ctx, hook) : "";
  const link = origin ? inviteLink(ctx) : "";

  function flash(what: Copied) {
    setCopied(what);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 2200);
  }

  async function copy(text: string, what: Copied) {
    try {
      await navigator.clipboard.writeText(text);
      flash(what);
    } catch {
      // No clipboard (insecure context, or the user denied it) — show the text
      // so they can still select it by hand rather than failing silently.
      window.prompt("Copy this:", text);
    }
  }

  async function share() {
    // The message already ends with the link; passing `url` too makes iOS and
    // Android render a proper link preview instead of bare text.
    try {
      await navigator.share({ title: missionName, text: message, url: link });
    } catch (err) {
      // AbortError just means they dismissed the sheet — not a failure.
      if ((err as Error)?.name !== "AbortError") void copy(message, "message");
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2">
        <code className="rounded-md border border-line bg-sunken px-2 py-1 font-mono text-sm tracking-[0.2em]">
          {code}
        </code>
        <Button
          type="button"
          variant="secondary"
          className={cx("px-3 text-xs", compact && "min-h-9")}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          Invite
        </Button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-label="Invite someone"
          className={cx(
            // On a phone this is a bottom sheet: the trigger sits mid-page, so
            // an anchored dropdown ran a third of its width off-screen. From sm
            // up there's room to anchor it to the button.
            "pop-in fixed inset-x-3 bottom-3 z-(--z-overlay) rounded-xl",
            "border border-line bg-surface p-3 shadow-(--shadow-pop)",
            "sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:z-(--z-dropdown)",
            "sm:mt-2 sm:w-[22rem]",
            compact ? "sm:left-0" : "sm:right-0",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted">They&rsquo;ll get</p>
            <button
              type="button"
              onClick={() => setHook((h) => h + 1)}
              className="min-h-8 rounded-md px-2 text-xs text-muted transition-colors hover:bg-sunken hover:text-fg"
            >
              Different wording
            </button>
          </div>

          <p className="whitespace-pre-wrap rounded-lg border border-line bg-sunken px-3 py-2.5 text-sm">
            {message || "…"}
          </p>

          <div className="mt-3 space-y-2">
            {canShare ? (
              <Button type="button" className="w-full" onClick={share}>
                Share
              </Button>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={canShare ? "secondary" : "primary"}
                className="flex-1 px-2 text-xs"
                onClick={() => copy(message, "message")}
              >
                {copied === "message" ? "Copied" : "Copy message"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 px-2 text-xs"
                onClick={() => copy(link, "link")}
              >
                {copied === "link" ? "Copied" : "Copy link"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="px-2 text-xs"
                onClick={() => copy(code, "code")}
              >
                {copied === "code" ? "Copied" : "Code"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
