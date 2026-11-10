import { describe, expect, it } from "vitest";
import { formatKey } from "./format";

describe("formatKey", () => {
  it("writes modifiers and a letter", () => {
    expect(formatKey("ctrl+shift+s", false)).toBe("Ctrl+Shift+S");
    expect(formatKey("ctrl+alt+shift+t", false)).toBe("Ctrl+Alt+Shift+T");
  });
  it("names special keys", () => {
    expect(formatKey("alt+up", false)).toBe("Alt+Up");
    expect(formatKey("ctrl+tab", false)).toBe("Ctrl+Tab");
    expect(formatKey("enter", false)).toBe("Enter");
  });
  it("keeps symbol keys", () => {
    expect(formatKey("ctrl+/", false)).toBe("Ctrl+/");
    expect(formatKey("ctrl+shift+\\", false)).toBe("Ctrl+Shift+\\");
    expect(formatKey("ctrl++", false)).toBe("Ctrl++");
  });
  it("writes a chord", () => {
    expect(formatKey("ctrl+k ctrl+d", false)).toBe("Ctrl+K Ctrl+D");
  });
  it("uses symbols on macOS", () => {
    // The keymap writes modifiers as ctrl, alt, shift, meta. macOS writes them in the same order.
    expect(formatKey("shift+meta+s", true)).toBe("⇧⌘S");
    expect(formatKey("alt+up", true)).toBe("⌥↑");
  });
});
