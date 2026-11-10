import { describe, expect, it } from "vitest";
import { canonicalStroke, parseKey, strokesFromEvent, type KeyLike } from "./keys";

const ev = (o: Partial<KeyLike>): KeyLike => ({
  key: "",
  code: "",
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...o,
});

describe("canonicalStroke", () => {
  it("orders modifiers and lowercases", () => {
    expect(canonicalStroke("Shift+Ctrl+L", false)).toBe("ctrl+shift+l");
  });
  it("maps mod to ctrl or meta", () => {
    expect(canonicalStroke("mod+d", false)).toBe("ctrl+d");
    expect(canonicalStroke("mod+d", true)).toBe("meta+d");
  });
  it("uses short names for arrow keys", () => {
    expect(canonicalStroke("ctrl+alt+ArrowUp", false)).toBe("ctrl+alt+up");
  });
  it("accepts the plus key", () => {
    expect(canonicalStroke("ctrl++", false)).toBe("ctrl++");
  });
  it("rejects an unknown modifier", () => {
    expect(() => canonicalStroke("hyper+a", false)).toThrow();
  });
});

describe("parseKey", () => {
  it("parses a chord", () => {
    expect(parseKey("mod+k  mod+d", false)).toEqual(["ctrl+k", "ctrl+d"]);
  });
  it("rejects an empty key", () => {
    expect(() => parseKey("  ", false)).toThrow();
  });
});

describe("strokesFromEvent", () => {
  it("matches the typed character and the physical key", () => {
    expect(strokesFromEvent(ev({ key: "d", code: "KeyD", ctrlKey: true }))).toEqual(["ctrl+d"]);
  });
  it("matches a shifted letter by its lowercase name", () => {
    expect(strokesFromEvent(ev({ key: "L", code: "KeyL", ctrlKey: true, shiftKey: true }))).toContain("ctrl+shift+l");
  });
  it("matches a shifted symbol through the physical key", () => {
    // Ctrl+Shift+\ types "|" on a US keyboard.
    expect(strokesFromEvent(ev({ key: "|", code: "Backslash", ctrlKey: true, shiftKey: true }))).toContain("ctrl+shift+\\");
  });
  it("names arrow keys", () => {
    expect(strokesFromEvent(ev({ key: "ArrowUp", code: "ArrowUp", altKey: true }))).toEqual(["alt+up"]);
  });
  it("in physical mode ignores the typed character", () => {
    // On a French layout, the key at the "Q" position types "a".
    const e = ev({ key: "a", code: "KeyQ", ctrlKey: true });
    expect(strokesFromEvent(e, true)).toEqual(["ctrl+q"]);
    expect(strokesFromEvent(e, false)).toContain("ctrl+a");
  });
});
