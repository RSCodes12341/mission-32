export const THEME_KEY = "m32.theme";
export const ACCENT_KEY = "m32.accent";

export type ThemeMode = "light" | "dark" | "system";

/**
 * Accents are a hue angle only. Lightness and chroma live in globals.css and are
 * identical for every option, so contrast against text and surfaces is the same
 * whichever one someone picks — no per-colour tuning, no unreadable choices.
 */
export const ACCENTS = [
  { id: "red", name: "Red", hue: 27 },
  { id: "orange", name: "Orange", hue: 52 },
  { id: "amber", name: "Amber", hue: 78 },
  { id: "yellow", name: "Yellow", hue: 100 },
  { id: "lime", name: "Lime", hue: 128 },
  { id: "green", name: "Green", hue: 150 },
  { id: "teal", name: "Teal", hue: 180 },
  { id: "cyan", name: "Cyan", hue: 210 },
  { id: "blue", name: "Blue", hue: 255 },
  { id: "indigo", name: "Indigo", hue: 278 },
  { id: "violet", name: "Violet", hue: 300 },
  { id: "magenta", name: "Magenta", hue: 328 },
  { id: "pink", name: "Pink", hue: 355 },
  { id: "slate", name: "Slate", hue: 250, chroma: 0.04 },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export const DEFAULT_ACCENT: AccentId = "green";
export const DEFAULT_MODE: ThemeMode = "system";

export function accentById(id: string) {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS.find((a) => a.id === DEFAULT_ACCENT)!;
}

/**
 * Runs before first paint, inlined in <head>. Without it the page renders in the
 * default theme and then snaps to the chosen one — the flash every themed app
 * gets wrong. Kept dependency-free and small on purpose.
 */
export const THEME_BOOT_SCRIPT = `
(function(){
  try{
    var A=${JSON.stringify(
      Object.fromEntries(
        ACCENTS.map((a) => [a.id, [a.hue, "chroma" in a ? a.chroma : null]]),
      ),
    )};
    var r=document.documentElement;
    var m=localStorage.getItem(${JSON.stringify(THEME_KEY)})||${JSON.stringify(DEFAULT_MODE)};
    var dark=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
    r.dataset.theme=dark?"dark":"light";
    r.style.colorScheme=dark?"dark":"light";
    var a=A[localStorage.getItem(${JSON.stringify(ACCENT_KEY)})||${JSON.stringify(DEFAULT_ACCENT)}]
       ||A[${JSON.stringify(DEFAULT_ACCENT)}];
    r.style.setProperty("--accent-hue",String(a[0]));
    if(a[1]!==null)r.style.setProperty("--accent-chroma",String(a[1]));
  }catch(e){
    document.documentElement.dataset.theme="light";
  }
})();
`.trim();
