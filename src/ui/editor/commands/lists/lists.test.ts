import { describe, expect, it } from "vitest";
import {
  listEnter,
  listIndent,
  listOutdent,
  listBlockAround,
  parseListLine,
  parseQuoteLine,
  renumberList,
  toggleBullet,
  toggleNumbered,
  toggleTask,
  toggleTaskList,
} from "./index";
import { arrayLines } from "../shared";
import { runEdit } from "../testing";

describe("parseListLine", () => {
  it("reads a bullet", () => {
    expect(parseListLine("- item")).toMatchObject({ marker: "-", ordered: false, rest: "item", textFrom: 2, task: null });
  });
  it("reads an ordered item", () => {
    expect(parseListLine("  12) item")).toMatchObject({ marker: "12)", ordered: true, number: 12, delim: ")", indent: "  ", contentCol: 6 });
  });
  it("reads a task", () => {
    expect(parseListLine("- [x] done")).toMatchObject({ task: "x", rest: "done", textFrom: 6 });
  });
  it("reads an empty item", () => {
    expect(parseListLine("- ")).toMatchObject({ rest: "", textFrom: 2 });
    expect(parseListLine("-")).toMatchObject({ rest: "", gap: "" });
  });
  it("does not read a rule, bold text, or a plain line", () => {
    expect(parseListLine("---")).toBeNull();
    expect(parseListLine("**bold**")).toBeNull();
    expect(parseListLine("text")).toBeNull();
    expect(parseListLine("1.5 is a number")).toBeNull();
  });
  it("keeps [ ]text as text", () => {
    expect(parseListLine("- [ ]text")).toMatchObject({ task: null, rest: "[ ]text" });
  });
});

describe("parseQuoteLine", () => {
  it("reads quote marks", () => {
    expect(parseQuoteLine("> a")).toEqual({ prefix: "> ", rest: "a" });
    expect(parseQuoteLine("> > a")).toEqual({ prefix: "> > ", rest: "a" });
    expect(parseQuoteLine("a")).toBeNull();
  });
});

describe("toggleBullet", () => {
  it("adds a marker", () => expect(runEdit("¦one", toggleBullet)).toBe("- ¦one"));
  it("adds markers to every line", () => expect(runEdit("⟦one\ntwo⟧", toggleBullet)).toBe("- ⟦one\n- two⟧"));
  it("removes markers when every line is a bullet", () => expect(runEdit("⟦- one\n- two⟧", toggleBullet)).toBe("⟦one\ntwo⟧"));
  it("adds markers to the plain lines and keeps the bullets", () => {
    expect(runEdit("⟦- one\ntwo⟧", toggleBullet)).toBe("⟦- one\n- two⟧");
  });
  it("turns numbered items into bullets", () => expect(runEdit("⟦1. a\n2. b⟧", toggleBullet)).toBe("⟦- a\n- b⟧"));
  it("turns * into - when it adds markers to the other lines", () => {
    expect(runEdit("⟦* a\nb⟧", toggleBullet)).toBe("⟦- a\n- b⟧");
  });
  it("removes * markers when every line is a bullet", () => expect(runEdit("⟦* a\n- b⟧", toggleBullet)).toBe("⟦a\nb⟧"));
  it("starts a list on an empty line", () => expect(runEdit("¦", toggleBullet)).toBe("- ¦"));
  it("skips blank lines in a selection", () => expect(runEdit("⟦a\n\nb⟧", toggleBullet)).toBe("- ⟦a\n\n- b⟧"));
  it("keeps the indent", () => expect(runEdit("  ¦a", toggleBullet)).toBe("  - ¦a"));
  it("keeps a checkbox", () => expect(runEdit("⟦1. [ ] a⟧", toggleBullet)).toBe("⟦- [ ] a⟧"));
  it("removes the indent of a nested item with its marker", () => expect(runEdit("  - ¦a", toggleBullet)).toBe("¦a"));
});

describe("toggleNumbered", () => {
  it("numbers the lines", () => expect(runEdit("⟦a\nb\nc⟧", toggleNumbered)).toBe("1. ⟦a\n2. b\n3. c⟧"));
  it("counts each nesting level on its own", () => {
    expect(runEdit("⟦a\n  b\n  c\nd⟧", toggleNumbered)).toBe("1. ⟦a\n  1. b\n  2. c\n2. d⟧");
  });
  it("turns bullets into numbers", () => expect(runEdit("⟦- a\n- b⟧", toggleNumbered)).toBe("⟦1. a\n2. b⟧"));
  it("removes numbers when every line is numbered", () => expect(runEdit("⟦1. a\n2. b⟧", toggleNumbered)).toBe("⟦a\nb⟧"));
  it("starts a list on an empty line", () => expect(runEdit("¦", toggleNumbered)).toBe("1. ¦"));
  it("turns 1) items into bullets", () => expect(runEdit("⟦1) a\n5) b⟧", toggleBullet)).toBe("⟦- a\n- b⟧"));
});

describe("toggleTaskList", () => {
  it("makes tasks of plain lines", () => expect(runEdit("⟦a\nb⟧", toggleTaskList)).toBe("- [ ] ⟦a\n- [ ] b⟧"));
  it("adds a checkbox to a bullet", () => expect(runEdit("⟦- a⟧", toggleTaskList)).toBe("⟦- [ ] a⟧"));
  it("adds a checkbox to a numbered item", () => expect(runEdit("⟦1. a⟧", toggleTaskList)).toBe("⟦1. [ ] a⟧"));
  it("removes the list when every line is a task", () => expect(runEdit("⟦- [ ] a\n- [x] b⟧", toggleTaskList)).toBe("⟦a\nb⟧"));
  it("starts a task on an empty line", () => expect(runEdit("¦", toggleTaskList)).toBe("- [ ] ¦"));
  it("adds a checkbox to a bare marker", () => expect(runEdit("-¦", toggleTaskList)).toBe("- [ ] ¦"));
});

describe("toggleTask", () => {
  it("checks an open task", () => expect(runEdit("- [ ] ¦a", toggleTask)).toBe("- [x] ¦a"));
  it("opens a done task", () => expect(runEdit("- [x] ¦a", toggleTask)).toBe("- [ ] ¦a"));
  it("opens a task with a capital X", () => expect(runEdit("- [X] ¦a", toggleTask)).toBe("- [ ] ¦a"));
  it("adds a checkbox to a list item", () => expect(runEdit("- ¦a", toggleTask)).toBe("- [ ] ¦a"));
  it("works on a numbered task", () => expect(runEdit("1. [ ] ¦a", toggleTask)).toBe("1. [x] ¦a"));
  it("works with the cursor anywhere on the line", () => expect(runEdit("- [ ] abc¦", toggleTask)).toBe("- [x] abc¦"));
  it("skips a line that is not a list item", () => expect(runEdit("¦plain", toggleTask)).toBe("¦plain"));
  it("works on every cursor line", () => expect(runEdit("- [ ] a¦\n- [ ] b¦", toggleTask)).toBe("- [x] a¦\n- [x] b¦"));
  it("keeps the indent", () => expect(runEdit("  - [ ] ¦a", toggleTask)).toBe("  - [x] ¦a"));
});

describe("renumberList", () => {
  it("fixes the numbers and keeps the first", () => {
    expect(runEdit("1. a\n3. b\n7. c¦", renumberList)).toBe("1. a\n2. b\n3. c¦");
  });
  it("keeps a start number other than 1", () => {
    expect(runEdit("3. a\n9. b¦", renumberList)).toBe("3. a\n4. b¦");
  });
  it("counts each level on its own", () => {
    expect(runEdit("1. a\n   1. x\n   3. y\n3. b¦", renumberList)).toBe("1. a\n   1. x\n   2. y\n2. b¦");
  });
  it("goes from the cursor to the whole list, with blank lines in it", () => {
    expect(runEdit("1. a\n\n5. b\n\n9. c¦\n\ntext\n\n4. d", renumberList)).toBe("1. a\n\n2. b\n\n3. c¦\n\ntext\n\n4. d");
  });
  it("uses the selection when there is one", () => {
    expect(runEdit("⟦1. a\n5. b⟧\n9. c", renumberList)).toBe("⟦1. a\n2. b⟧\n9. c");
  });
  it("restarts after a bullet at the same level", () => {
    expect(runEdit("1. a\n- b\n4. c¦", renumberList)).toBe("1. a\n- b\n4. c¦");
  });
  it("keeps the delimiter", () => expect(runEdit("1) a\n4) b¦", renumberList)).toBe("1) a\n2) b¦"));
  it("does nothing when the cursor is not in a list", () => expect(runEdit("text¦", renumberList)).toBe("text¦"));
  it("does nothing when the numbers are right", () => expect(runEdit("1. a\n2. b¦", renumberList)).toBe("1. a\n2. b¦"));
  it("handles numbers with more digits", () => expect(runEdit("9. a\n9. b\n9. c¦", renumberList)).toBe("9. a\n10. b\n11. c¦"));
});

describe("listBlockAround", () => {
  it("finds the list with blank lines and continuation lines", () => {
    const src = arrayLines(["text", "", "- a", "  more", "", "- b", "", "other"]);
    expect(listBlockAround(src, 4)).toEqual([3, 6]);
    expect(listBlockAround(src, 1)).toBeNull();
  });
});

describe("listEnter", () => {
  it("continues a bullet", () => expect(runEdit("- item¦", listEnter)).toBe("- item\n- ¦"));
  it("keeps the marker character", () => expect(runEdit("* item¦", listEnter)).toBe("* item\n* ¦"));
  it("continues a numbered item with the next number", () => expect(runEdit("1. a¦", listEnter)).toBe("1. a\n2. ¦"));
  it("renumbers the items after the new one", () => expect(runEdit("1. a¦\n2. b\n3. c", listEnter)).toBe("1. a\n2. ¦\n3. b\n4. c"));
  it("does not renumber a nested list or the next list", () => {
    expect(runEdit("1. a¦\n   1. x\n2. b", listEnter)).toBe("1. a\n2. ¦\n   1. x\n3. b");
  });
  it("continues a task as an open task", () => expect(runEdit("- [x] done¦", listEnter)).toBe("- [x] done\n- [ ] ¦"));
  it("splits an item at the cursor", () => expect(runEdit("- ab¦cd", listEnter)).toBe("- ab\n- ¦cd"));
  it("keeps the indent", () => expect(runEdit("  - a¦", listEnter)).toBe("  - a\n  - ¦"));
  it("removes the marker of an empty item", () => expect(runEdit("- a\n- ¦", listEnter)).toBe("- a\n¦"));
  it("removes an empty task", () => expect(runEdit("- [ ] ¦", listEnter)).toBe("¦"));
  it("removes an empty numbered item", () => expect(runEdit("1. a\n2. ¦", listEnter)).toBe("1. a\n¦"));
  it("continues a quote", () => expect(runEdit("> a¦", listEnter)).toBe("> a\n> ¦"));
  it("continues a nested quote", () => expect(runEdit("> > a¦", listEnter)).toBe("> > a\n> > ¦"));
  it("ends a quote on an empty quote line", () => expect(runEdit("> a\n> ¦", listEnter)).toBe("> a\n¦"));
  it("returns null for a plain line, so the normal newline runs", () => {
    expect(runEdit("text¦", listEnter)).toBe("text¦");
  });
  it("returns null when text is selected", () => expect(runEdit("- ⟦a⟧", listEnter)).toBe("- ⟦a⟧"));
  it("returns null when the cursor is inside the marker", () => expect(runEdit("-¦ a", listEnter)).toBe("-¦ a"));
  it("works with several cursors, and copies the indent on a plain line", () => {
    expect(runEdit("- a¦\n  text¦", listEnter)).toBe("- a\n- ¦\n  text\n  ¦");
  });
});

describe("listIndent and listOutdent", () => {
  it("nests a bullet under the one above", () => expect(runEdit("- a\n- ¦b", listIndent)).toBe("- a\n  - ¦b"));
  it("nests a numbered item at the content column, and starts at 1", () => {
    expect(runEdit("1. a\n2. ¦b", listIndent)).toBe("1. a\n   1. ¦b");
  });
  it("renumbers the items after a nested one", () => {
    expect(runEdit("1. a\n2. ¦b\n3. c", listIndent)).toBe("1. a\n   1. ¦b\n2. c");
  });
  it("continues the numbers of a nested list that exists", () => {
    expect(runEdit("1. a\n   1. x\n2. ¦b", listIndent)).toBe("1. a\n   1. x\n   2. ¦b");
  });
  it("moves the sub-items with the item", () => {
    expect(runEdit("- a\n- ¦b\n  - c\n- d", listIndent)).toBe("- a\n  - ¦b\n    - c\n- d");
  });
  it("indents by 2 when there is no item above", () => expect(runEdit("- ¦a", listIndent)).toBe("  - ¦a"));
  it("indents every selected item by the same amount", () => {
    expect(runEdit("- a\n⟦- b\n- c⟧", listIndent)).toBe("- a\n  ⟦- b\n  - c⟧");
  });
  it("returns null when no selected line is a list item", () => expect(runEdit("¦text", listIndent)).toBe("¦text"));
  it("moves an item out to the level of its parent", () => expect(runEdit("- a\n  - ¦b", listOutdent)).toBe("- a\n- ¦b"));
  it("moves an item out of a numbered parent", () => {
    expect(runEdit("1. a\n   1. ¦b\n2. c", listOutdent)).toBe("1. a\n2. ¦b\n3. c");
  });
  it("moves the sub-items out too", () => {
    expect(runEdit("- a\n  - ¦b\n    - c", listOutdent)).toBe("- a\n- ¦b\n  - c");
  });
  it("does nothing at the top level", () => expect(runEdit("- ¦a", listOutdent)).toBe("- ¦a"));
  it("removes a tab indent", () => expect(runEdit("- a\n\t- ¦b", listOutdent)).toBe("- a\n- ¦b"));
});
