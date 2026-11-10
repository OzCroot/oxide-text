import { describe, expect, it } from "vitest";
import { slugify, uniqueSlugger } from "./slug";

describe("slugify", () => {
  it("lowercases, drops punctuation, and joins with hyphens", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("  What's New in v2.0? ")).toBe("whats-new-in-v20");
  });
  it("keeps letters from other scripts", () => {
    expect(slugify("Über Café")).toBe("über-café");
    expect(slugify("日本語 の 見出し")).toBe("日本語-の-見出し");
  });
});

describe("uniqueSlugger", () => {
  it("numbers repeated headings", () => {
    const s = uniqueSlugger();
    expect([s("Intro"), s("Intro"), s("Intro")]).toEqual(["intro", "intro-1", "intro-2"]);
  });
  it("does not clash with a real heading that looks numbered", () => {
    const s = uniqueSlugger();
    expect([s("A"), s("A 1"), s("A")]).toEqual(["a", "a-1", "a-2"]);
  });
  it("names an empty heading", () => {
    expect(uniqueSlugger()("!!!")).toBe("section");
  });
});
