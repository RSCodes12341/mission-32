"use client";

import { useEffect, useRef, useState } from "react";

import {
  ACCENTS,
  ACCENT_KEY,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  THEME_KEY,
  accentById,
  type ThemeMode,
} from "@/lib/theme";

const MODES: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "Auto" },
];

function applyMode(mode: ThemeMode) {
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";

  // Keep the browser/OS chrome in step with the page.
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute("content", dark ? "#232326" : "#fbfbfa");
}

function applyAccent(id: string) {
  const accent = accentById(id);
  const root = document.documentElement;
  root.style.setProperty("--accent-hue", String(accent.hue));
  root.style.setProperty(
    "--accent-chroma",
    "chroma" in accent ? String(accent.chroma) : "0.16",
  );
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_MODE);
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Read what the boot script already applied, so the UI matches the page.
  useEffect(() => {
    setMode((localStorage.getItem(THEME_KEY) as ThemeMode) || DEFAULT_MODE);
    setAccent(localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT);
    setReady(true);
  }, []);

  // "Auto" has to keep tracking the OS after first paint.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyMode("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function chooseMode(next: ThemeMode) {
    setMode(next);
    localStorage.setItem(THEME_KEY, next);
    applyMode(next);
  }

  function chooseAccent(id: string) {
    setAccent(id);
    localStorage.setItem(ACCENT_KEY, id);
    applyAccent(id);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Appearance"
        className="grid h-11 w-11 place-items-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-fg"
      >
        <span
          aria-hidden
          className="h-4 w-4 rounded-full border border-line-strong bg-accent"
        />
      </button>

      {open && ready ? (
        <div
          role="dialog"
          aria-label="Appearance"
          className="pop-in absolute right-0 top-full z-(--z-dropdown) mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-(--shadow-pop)"
        >
          <p className="mb-2 text-xs font-medium text-muted">Theme</p>
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-sunken p-1"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                onClick={() => chooseMode(m.id)}
                className={`h-8 rounded-md text-xs font-medium transition-colors ${
                  mode === m.id
                    ? "bg-surface text-fg shadow-[0_0_0_1px_var(--line)]"
                    : "text-muted hover:text-fg"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs font-medium text-muted">Accent</p>
          <div role="radiogroup" aria-label="Accent colour" className="grid grid-cols-7 gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={accent === a.id}
                aria-label={a.name}
                title={a.name}
                onClick={() => chooseAccent(a.id)}
                className={`grid h-8 w-8 place-items-center rounded-full transition-transform hover:scale-110 ${
                  accent === a.id ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="h-5 w-5 rounded-full border border-black/10"
                  style={{
                    background: `oklch(var(--swatch-l) ${"chroma" in a ? a.chroma : 0.16} ${a.hue})`,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
