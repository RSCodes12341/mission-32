"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui";

/** VAPID keys travel as base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type State = "checking" | "unsupported" | "needs-install" | "off" | "on" | "blocked";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function NotificationsButton() {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        // On iOS, PushManager only exists once the site runs from the home screen.
        if (!cancelled) setState(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (!("PushManager" in window)) {
        if (!cancelled) setState(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("blocked");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled) setState(existing ? "on" : "off");
    })().catch(() => {
      if (!cancelled) setState("unsupported");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setError("Push isn't configured on the server yet.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        }));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("subscribe failed");

      setState("on");
    } catch {
      setError("Could not turn on notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setError("Could not turn notifications off.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") return null;

  const message = {
    unsupported: "This browser doesn't support push notifications.",
    "needs-install": "Tap Share → Add to Home Screen, then open it from there to enable notifications.",
    blocked: "Notifications are blocked in your browser settings for this site.",
    off: null,
    on: null,
    checking: null,
  }[state];

  return (
    <div className="space-y-1.5">
      {state === "off" || state === "on" ? (
        <Button
          type="button"
          variant="secondary"
          className="h-8 px-3 text-xs"
          disabled={busy}
          onClick={state === "on" ? disable : enable}
        >
          {busy
            ? "Working…"
            : state === "on"
              ? "Notifications on"
              : "Turn on notifications"}
        </Button>
      ) : null}

      {message ? <p className="max-w-xs text-xs text-subtle">{message}</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
