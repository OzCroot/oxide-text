import { describe, expect, it } from "vitest";
import { fallbackSettings, resolveTheme, sanitiseSettings } from "./settings";

describe("sanitiseSettings", () => {
  it("keeps good values", () => {
    const s = sanitiseSettings({ theme: "dark", editor: { fontSize: 18, wordWrap: false }, files: { defaultEol: "crlf" } });
    expect(s).toEqual({ theme: "dark", editor: { fontSize: 18, wordWrap: false }, files: { defaultEol: "crlf" } });
  });
  it("falls back for bad values", () => {
    const s = sanitiseSettings({ theme: "purple", editor: { fontSize: 3, wordWrap: "yes" }, files: { defaultEol: "x" } });
    expect(s).toEqual(fallbackSettings);
  });
  it("accepts null", () => {
    expect(sanitiseSettings(null)).toEqual(fallbackSettings);
  });
});

describe("resolveTheme", () => {
  it("follows the system for 'system'", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
  it("ignores the system for an explicit theme", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });
});
