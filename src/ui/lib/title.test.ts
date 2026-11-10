import { describe, expect, it } from "vitest";
import { taskbarTitle, windowTitle } from "./title";

describe("window title", () => {
  it("names the file and the app", () => {
    expect(windowTitle("notes.md")).toBe("notes.md — oxide-text");
  });
  it("is the app name with no file", () => {
    expect(windowTitle(null)).toBe("oxide-text");
  });
  it("adds a dot for unsaved changes", () => {
    expect(taskbarTitle("notes.md", true)).toBe("● notes.md — oxide-text");
    expect(taskbarTitle("notes.md", false)).toBe("notes.md — oxide-text");
    expect(taskbarTitle(null, true)).toBe("oxide-text");
  });
});
