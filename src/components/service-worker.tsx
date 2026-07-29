"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that backs offline load and push delivery.
 *
 * Production only. In development Next serves chunks at stable, non-hashed paths
 * like /_next/static/chunks/app/layout.js, so the worker's cache-first rule pins
 * the first build forever and every later edit loads stale JavaScript. Production
 * chunks are content-hashed, so a new build means new URLs and the cache is safe.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Tear down anything a previous production build (or an earlier dev run)
      // left registered, otherwise it keeps serving stale chunks here.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      if ("caches" in window) {
        void caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("Service worker registration failed", err));
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
