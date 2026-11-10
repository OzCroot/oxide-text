import { describe, expect, it } from "vitest";
import { classifyHref } from "./links";

const base = "/docs/notes";

describe("classifyHref", () => {
  it("jumps to an anchor in the same document", () => {
    expect(classifyHref("#My%20Part", base)).toEqual({ kind: "anchor", id: "My Part" });
  });
  it("opens a web link outside", () => {
    expect(classifyHref("https://example.com/a", base)).toEqual({ kind: "external", url: "https://example.com/a" });
    expect(classifyHref("mailto:a@b.c", base)).toMatchObject({ kind: "external" });
  });
  it("resolves a relative file from the document folder", () => {
    expect(classifyHref("./a.md", base)).toEqual({ kind: "file", path: "/docs/notes/a.md", anchor: "" });
    expect(classifyHref("../x/b.md#intro", base)).toEqual({ kind: "file", path: "/docs/x/b.md", anchor: "intro" });
  });
  it("decodes percent escapes in a path", () => {
    expect(classifyHref("my%20file.md", base)).toMatchObject({ path: "/docs/notes/my file.md" });
  });
  it("keeps an absolute path", () => {
    expect(classifyHref("/etc/a.md", base)).toMatchObject({ kind: "file", path: "/etc/a.md" });
  });
  it("does nothing for dangerous or unknown schemes", () => {
    expect(classifyHref("javascript:alert(1)", base)).toEqual({ kind: "none" });
    expect(classifyHref("file:///etc/passwd", base)).toEqual({ kind: "none" });
    expect(classifyHref("data:text/html,x", base)).toEqual({ kind: "none" });
  });
  it("does nothing for a relative link in an unsaved document", () => {
    expect(classifyHref("./a.md", null)).toEqual({ kind: "none" });
    expect(classifyHref("#x", null)).toEqual({ kind: "anchor", id: "x" });
  });
  it("does nothing for an empty link", () => {
    expect(classifyHref("", base)).toEqual({ kind: "none" });
    expect(classifyHref(null, base)).toEqual({ kind: "none" });
  });
});
