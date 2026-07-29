"use client";

import { useEffect, type RefObject } from "react";

/**
 * Closes a popover on Escape or a pointer press outside `ref`.
 *
 * The listener is attached on the next frame rather than immediately. Attaching
 * it synchronously leaves a race with the very interaction that opened the
 * panel — the opening press can still be in flight and gets read as an
 * outside click, so the panel opens and shuts in the same gesture. Real touch
 * usually wins that race, which makes it an intermittent bug rather than an
 * obvious one.
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const raf = requestAnimationFrame(() => {
      document.addEventListener("pointerdown", onPointerDown);
    });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, onClose]);
}
