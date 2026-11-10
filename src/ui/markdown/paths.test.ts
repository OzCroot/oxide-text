import { describe, expect, it } from "vitest";
import { baseName, dirname, extensionOf, hasScheme, joinPath, relativePath, splitAnchor, stemOf } from "./paths";

describe("joinPath", () => {
  it("joins and resolves . and ..", () => {
    expect(joinPath("/a/b", "./c.md")).toBe("/a/b/c.md");
    expect(joinPath("/a/b", "../c.md")).toBe("/a/c.md");
    expect(joinPath("/a/b", "../../../c.md")).toBe("/c.md");
  });
  it("keeps the Windows style", () => {
    expect(joinPath("C:\\docs\\notes", "..\\img/a.png")).toBe("C:\\docs\\img\\a.png");
  });
});

describe("dirname", () => {
  it("returns the folder", () => {
    expect(dirname("/a/b/c.md")).toBe("/a/b");
    expect(dirname("/c.md")).toBe("/");
    expect(dirname("C:\\a\\c.md")).toBe("C:\\a");
  });
});

describe("relativePath", () => {
  it("goes down", () => expect(relativePath("/a/b", "/a/b/assets/x.png")).toBe("./assets/x.png"));
  it("goes up", () => expect(relativePath("/a/b", "/a/c/x.png")).toBe("../c/x.png"));
  it("is . for the same folder", () => expect(relativePath("/a", "/a")).toBe("."));
  it("falls back to the target on a different drive", () => {
    expect(relativePath("C:\\a", "D:\\b\\x.png")).toBe("D:/b/x.png");
  });
});

describe("names", () => {
  it("splits a file name", () => {
    expect(baseName("/a/b/c.test.md")).toBe("c.test.md");
    expect(stemOf("/a/b/c.test.md")).toBe("c.test");
    expect(extensionOf("/a/b/README.MD")).toBe("md");
    expect(extensionOf("/a/.gitignore")).toBe("");
  });
});

describe("hasScheme", () => {
  it("detects schemes", () => {
    expect(hasScheme("https://x.y")).toBe(true);
    expect(hasScheme("mailto:a@b.c")).toBe(true);
    expect(hasScheme("//cdn.x/y.png")).toBe(true);
    expect(hasScheme("./a.md")).toBe(false);
    expect(hasScheme("C:\\a\\b.png")).toBe(false);
  });
});

describe("splitAnchor", () => {
  it("splits at the first #", () => {
    expect(splitAnchor("a.md#intro")).toEqual({ path: "a.md", anchor: "intro" });
    expect(splitAnchor("a.md")).toEqual({ path: "a.md", anchor: "" });
  });
});
