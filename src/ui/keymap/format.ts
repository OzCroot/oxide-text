const NAMES: Record<string, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  enter: "Enter",
  tab: "Tab",
  escape: "Esc",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  pageup: "PageUp",
  pagedown: "PageDown",
  home: "Home",
  end: "End",
};

const MAC_MODS: Record<string, string> = { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" };
const MAC_KEYS: Record<string, string> = { up: "↑", down: "↓", left: "←", right: "→", enter: "↩", tab: "⇥", escape: "⎋", backspace: "⌫", delete: "⌦" };

function formatStroke(stroke: string, isMac: boolean): string {
  const parts = stroke.split("+");
  // A trailing "+" is the plus key: "ctrl++".
  let key = parts.pop() ?? "";
  if (key === "" && parts.length > 0) {
    parts.pop();
    key = "+";
  }
  if (isMac) {
    const k = MAC_KEYS[key] ?? (key.length === 1 ? key.toUpperCase() : (NAMES[key] ?? key.toUpperCase()));
    return parts.map((m) => MAC_MODS[m] ?? m).join("") + k;
  }
  const k = NAMES[key] ?? (key.length === 1 ? key.toUpperCase() : /^f\d+$/.test(key) ? key.toUpperCase() : key);
  const mods = parts.map((m) => (m === "meta" ? "Win" : m[0]!.toUpperCase() + m.slice(1)));
  return [...mods, k].join("+");
}

/** A key from the keymap (canonical form, such as "ctrl+shift+s") for a menu: "Ctrl+Shift+S", or "⌃⇧S" on macOS. A chord has its strokes apart by a space. */
export function formatKey(key: string, isMac: boolean): string {
  return key
    .split(" ")
    .map((s) => formatStroke(s, isMac))
    .join(" ");
}
