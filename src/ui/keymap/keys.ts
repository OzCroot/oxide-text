// Key strings: "ctrl+shift+l", or a chord of several strokes: "ctrl+k ctrl+d".
// The alias "mod" means Ctrl on Windows and Linux, and Cmd on macOS.

const MOD_ORDER = ["ctrl", "alt", "shift", "meta"] as const;
type Mod = (typeof MOD_ORDER)[number];

const NAMES: Record<string, string> = {
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  " ": "space",
  esc: "escape",
  return: "enter",
  del: "delete",
  plus: "+",
  cmd: "meta",
  command: "meta",
  control: "ctrl",
  option: "alt",
};

const CODE_KEYS: Record<string, string> = {
  Backslash: "\\",
  BracketLeft: "[",
  BracketRight: "]",
  Slash: "/",
  Comma: ",",
  Period: ".",
  Minus: "-",
  Equal: "=",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
  Space: "space",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function keyName(name: string): string {
  const k = name.toLowerCase();
  return NAMES[k] ?? k;
}

function format(mods: Set<string>, key: string): string {
  return [...MOD_ORDER.filter((m) => mods.has(m)), key].join("+");
}

/** Convert one stroke such as "Mod+Shift+L" to its canonical form. */
export function canonicalStroke(stroke: string, isMac: boolean): string {
  const parts = stroke.trim().split("+");
  // A trailing "+" is the plus key: "ctrl++".
  let key = parts.pop() ?? "";
  if (key === "" && parts.length > 0) {
    parts.pop();
    key = "+";
  }
  const mods = new Set<string>();
  for (const p of parts) {
    const m = keyName(p);
    if (m === "mod") mods.add(isMac ? "meta" : "ctrl");
    else if ((MOD_ORDER as readonly string[]).includes(m)) mods.add(m as Mod);
    else throw new Error(`Unknown modifier "${p}" in "${stroke}"`);
  }
  return format(mods, keyName(key));
}

/** Convert a key string to a list of canonical strokes. */
export function parseKey(key: string, isMac: boolean): string[] {
  const strokes = key.trim().split(/\s+/).filter(Boolean);
  if (strokes.length === 0) throw new Error("Empty key");
  return strokes.map((s) => canonicalStroke(s, isMac));
}

export interface KeyLike {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * The canonical strokes that a key event can match. By default the typed
 * character and the physical key both count. With `physical`, only the
 * physical key counts.
 */
export function strokesFromEvent(e: KeyLike, physical = false): string[] {
  const mods = new Set<string>();
  if (e.ctrlKey) mods.add("ctrl");
  if (e.altKey) mods.add("alt");
  if (e.shiftKey) mods.add("shift");
  if (e.metaKey) mods.add("meta");

  const out: string[] = [];
  const fromCode = codeName(e.code);
  if (fromCode) out.push(format(mods, fromCode));
  if (!physical || !fromCode) {
    if (e.key && e.key !== "Dead" && e.key !== "Unidentified") {
      const k = e.key.length === 1 ? e.key.toLowerCase() : keyName(e.key);
      const s = format(mods, k);
      if (!out.includes(s)) out.unshift(s);
    }
  }
  return out;
}

function codeName(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (CODE_KEYS[code]) return CODE_KEYS[code]!;
  if (/^F([1-9]|1[0-2])$/.test(code)) return code.toLowerCase();
  if (/^(Enter|Tab|Escape|Backspace|Delete|Home|End|PageUp|PageDown)$/.test(code)) {
    return code.toLowerCase();
  }
  return null;
}

export function isModifierOnly(e: Pick<KeyLike, "key">): boolean {
  return ["Control", "Alt", "Shift", "Meta", "AltGraph", "CapsLock"].includes(e.key);
}
