import { describe, expect, it } from "vitest";
import { insertRule, toggleCodeBlock, toggleQuote } from "./index";
import { runEdit } from "../testing";

describe("toggleQuote", () => {
  it("quotes a line", () => expect(runEdit("¦a", toggleQuote)).toBe("> ¦a"));
  it("quotes every selected line", () => expect(runEdit("⟦a\nb⟧", toggleQuote)).toBe("> ⟦a\n> b⟧"));
  it("keeps a blank line in the quote", () => expect(runEdit("⟦a\n\nb⟧", toggleQuote)).toBe("> ⟦a\n>\n> b⟧"));
  it("unquotes", () => expect(runEdit("> ¦a", toggleQuote)).toBe("¦a"));
  it("unquotes every selected line", () => expect(runEdit("⟦> a\n> b⟧", toggleQuote)).toBe("⟦a\nb⟧"));
  it("unquotes one level of a nested quote", () => expect(runEdit("> > ¦a", toggleQuote)).toBe("> ¦a"));
  it("quotes mixed lines", () => expect(runEdit("⟦> a\nb⟧", toggleQuote)).toBe("> ⟦> a\n> b⟧"));
  it("starts a quote on an empty line", () => expect(runEdit("¦", toggleQuote)).toBe("> ¦"));
});

describe("toggleCodeBlock", () => {
  it("wraps the selected lines and puts the cursor after the opening fence", () => {
    expect(runEdit("⟦a\nb⟧", toggleCodeBlock)).toBe("```¦\na\nb\n```");
  });
  it("wraps the whole line when the selection is part of a line", () => {
    expect(runEdit("x ⟦a⟧ y", toggleCodeBlock)).toBe("```¦\nx a y\n```");
  });
  it("wraps the cursor line", () => expect(runEdit("one\ntw¦o\nthree", toggleCodeBlock)).toBe("one\n```¦\ntwo\n```\nthree"));
  it("inserts an empty block on an empty line", () => expect(runEdit("¦", toggleCodeBlock)).toBe("```¦\n\n```"));
  it("uses a longer fence when the text holds a fence", () => {
    expect(runEdit("⟦```\nx\n```⟧", toggleCodeBlock)).toBe("````¦\n```\nx\n```\n````");
  });
  it("removes the fences when the cursor is inside a block", () => {
    expect(runEdit("```js\n¦code\n```", toggleCodeBlock)).toBe("¦code");
  });
  it("removes the fences with text around the block", () => {
    expect(runEdit("a\n\n```\nco¦de\n```\n\nb", toggleCodeBlock)).toBe("a\n\nco¦de\n\nb");
  });
  it("removes an opening fence with no closing fence", () => {
    expect(runEdit("```\n¦code", toggleCodeBlock)).toBe("¦code");
  });
  it("removes a block with no lines inside", () => {
    expect(runEdit("```\n¦\n```", toggleCodeBlock)).toBe("¦");
  });
});

describe("insertRule", () => {
  it("adds a rule after the line, with a blank line before it", () => {
    expect(runEdit("text¦", insertRule)).toBe("text\n\n---\n¦");
  });
  it("puts the rule on an empty line", () => expect(runEdit("¦", insertRule)).toBe("---\n¦"));
  it("keeps the blank line above the rule, so the text does not become a heading", () => {
    expect(runEdit("text\n¦\nnext", insertRule)).toBe("text\n\n---\n¦\nnext");
  });
  it("puts a rule after a line in the middle of a document", () => {
    expect(runEdit("a¦\nb", insertRule)).toBe("a\n\n---\n¦\nb");
  });
});
