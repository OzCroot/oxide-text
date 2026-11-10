import { describe, expect, it } from "vitest";
import { looksLikeUrl, makeLink, toggleBold, toggleInlineCode, toggleItalic, toggleStrikethrough } from "./index";
import { runEdit } from "../testing";

describe("bold", () => {
  it("wraps a selection", () => expect(runEdit("⟦hello⟧", toggleBold)).toBe("**⟦hello⟧**"));
  it("removes markers outside the selection", () => expect(runEdit("**⟦hello⟧**", toggleBold)).toBe("⟦hello⟧"));
  it("removes markers inside the selection", () => expect(runEdit("⟦**hello**⟧", toggleBold)).toBe("⟦hello⟧"));
  it("wraps the word at a cursor and keeps the cursor in place", () => expect(runEdit("he¦llo", toggleBold)).toBe("**he¦llo**"));
  it("unwraps the word at a cursor", () => expect(runEdit("**he¦llo**", toggleBold)).toBe("he¦llo"));
  it("wraps text with several words", () => expect(runEdit("⟦a b⟧", toggleBold)).toBe("**⟦a b⟧**"));
  it("inserts a pair where there is no word, and puts the cursor inside", () => expect(runEdit("¦", toggleBold)).toBe("**¦**"));
  it("removes an empty pair", () => expect(runEdit("**¦**", toggleBold)).toBe("¦"));
  it("works on every cursor", () => expect(runEdit("foo¦ bar¦", toggleBold)).toBe("**foo¦** **bar¦**"));
  it("works on a selection on each of several lines", () => {
    expect(runEdit("⟦a⟧\n⟦b⟧", toggleBold)).toBe("**⟦a⟧**\n**⟦b⟧**");
  });
  it("is undone by a second call", () => {
    const once = runEdit("⟦hello⟧", toggleBold);
    expect(runEdit(once, toggleBold)).toBe("⟦hello⟧");
  });
});

describe("italic", () => {
  it("wraps with one star", () => expect(runEdit("⟦a⟧", toggleItalic)).toBe("*⟦a⟧*"));
  it("removes one star", () => expect(runEdit("*⟦a⟧*", toggleItalic)).toBe("⟦a⟧"));
  it("adds italic to bold text", () => expect(runEdit("**⟦a⟧**", toggleItalic)).toBe("***⟦a⟧***"));
  it("removes italic and keeps bold", () => expect(runEdit("***⟦a⟧***", toggleItalic)).toBe("**⟦a⟧**"));
  it("adds bold to italic text", () => expect(runEdit("*⟦a⟧*", toggleBold)).toBe("***⟦a⟧***"));
  it("removes bold and keeps italic", () => expect(runEdit("***⟦a⟧***", toggleBold)).toBe("*⟦a⟧*"));
});

describe("strikethrough and code", () => {
  it("strikethrough wraps", () => expect(runEdit("⟦a⟧", toggleStrikethrough)).toBe("~~⟦a⟧~~"));
  it("strikethrough unwraps", () => expect(runEdit("~~⟦a⟧~~", toggleStrikethrough)).toBe("⟦a⟧"));
  it("code wraps", () => expect(runEdit("⟦a⟧", toggleInlineCode)).toBe("`⟦a⟧`"));
  it("code unwraps", () => expect(runEdit("`⟦a⟧`", toggleInlineCode)).toBe("⟦a⟧"));
  it("code on a word at a cursor", () => expect(runEdit("x¦yz", toggleInlineCode)).toBe("`x¦yz`"));
});

describe("looksLikeUrl", () => {
  it.each(["https://example.com", "http://a.b/c?d=e#f", "mailto:me@example.com", "www.example.com", " https://x.y "])("accepts %s", (t) => {
    expect(looksLikeUrl(t)).toBe(true);
  });
  it.each(["", "hello", "two words", "not a url.", "foo bar://x"])("rejects %j", (t) => {
    expect(looksLikeUrl(t)).toBe(false);
  });
});

describe("link", () => {
  it("makes [text]() and puts the cursor in the parentheses", () => {
    expect(runEdit("⟦text⟧", makeLink(null))).toBe("[text](¦)");
  });
  it("wraps with a URL from the clipboard, and puts the cursor after the link", () => {
    expect(runEdit("⟦text⟧", makeLink("https://x.y"))).toBe("[text](https://x.y)¦");
  });
  it("makes empty brackets when nothing is selected", () => {
    expect(runEdit("¦", makeLink(null))).toBe("[¦]()");
  });
  it("puts the cursor in empty brackets with a clipboard URL and no selection", () => {
    expect(runEdit("¦", makeLink("https://x.y"))).toBe("[¦](https://x.y)");
  });
  it("uses a selected URL as the target", () => {
    expect(runEdit("⟦https://a.b⟧", makeLink(null))).toBe("[¦](https://a.b)");
  });
  it("uses the word at a cursor", () => {
    expect(runEdit("he¦llo", makeLink(null))).toBe("[hello](¦)");
  });
});
