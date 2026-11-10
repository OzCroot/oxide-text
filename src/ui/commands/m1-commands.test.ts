import { describe, expect, it } from "vitest";
import { createRegistry } from ".";

// M1 exit criterion: all section 3.3 commands of the plan are in the registry.
describe("M1 commands", () => {
  const registry = createRegistry();
  const ids = [
    // inline formatting and link
    "format.bold", "format.italic", "format.strikethrough", "format.code", "format.link",
    // headings
    "heading.up", "heading.down", "heading.clear", "heading.set1", "heading.set2", "heading.set3", "heading.set4", "heading.set5", "heading.set6",
    // lists
    "list.bullet", "list.numbered", "list.task", "list.renumber", "task.toggle", "edit.enter", "edit.tab", "edit.shiftTab",
    // blocks
    "block.quote", "block.codeBlock", "block.rule",
    // tables
    "table.insert", "table.addRowAbove", "table.addRowBelow", "table.deleteRow", "table.addColumnLeft", "table.addColumnRight",
    "table.deleteColumn", "table.alignLeft", "table.alignCenter", "table.alignRight", "table.format",
    // views, outline, export
    "view.source", "view.preview", "view.split", "view.cycleMode", "view.toggleOutline", "view.toggleMenuBar", "export.html", "export.pdf", "edit.copyAsRichText",
    // folding
    "fold.fold", "fold.unfold", "fold.foldAll", "fold.unfoldAll",
  ];
  it.each(ids)("has %s", (id) => {
    expect(registry.has(id)).toBe(true);
  });
});
