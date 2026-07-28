"use client";

import { useEffect } from "react";

export type ViewerPhoto = { url: string; label: string; caption: string };

export function PhotoViewer({
  photo,
  onClose,
}: {
  photo: ViewerPhoto | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!photo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Stop the page behind the overlay from scrolling on touch.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.label} photo — ${photo.caption}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
      >
        Close
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={`${photo.label} — ${photo.caption}`}
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-3 text-sm text-white/70">
        {photo.label} · {photo.caption}
      </p>
    </div>
  );
}
