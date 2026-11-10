import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultKeymap } from "../keymap/default-keymap";
import { compileLayers } from "../keymap/resolver";
import { asView, fakeView, render } from "../editor/commands/testing";
import { appCommands } from "./app-commands";
import { editorCommands } from "./editor-commands";
import { enterKey, markdownCommands, markdownKeymap, shiftTabKey, tabKey } from "./markdown-commands";
import { CommandRegistry, type AppActions } from "./registry";

const registry = new CommandRegistry();
registry.register(...appCommands, ...editorCommands, ...markdownCommands);

const EXPECTED_IDS = [
  "format.bold", "format.italic", "format.strikethrough", "format.code", "format.link",
  "heading.up", "heading.down", "heading.set1", "heading.set2", "heading.set3", "heading.set4", "heading.set5", "heading.set6", "heading.clear",
  "list.bullet", "list.numbered", "list.task", "list.renumber", "task.toggle",
  "block.quote", "block.codeBlock", "block.rule",
  "table.insert", "table.addRowAbove", "table.addRowBelow", "table.deleteRow",
  "table.addColumnLeft", "table.addColumnRight", "table.deleteColumn",
  "table.alignLeft", "table.alignCenter", "table.alignRight", "table.format",
  "edit.enter", "edit.tab", "edit.shiftTab",
];

async function run(id: string, marked: string): Promise<string> {
  const view = fakeView(marked);
  const found = await registry.run(id, { view: asView(view), app: {} as AppActions });
  expect(found).toBe(true);
  return render(view.state);
}

describe("markdownCommands", () => {
  it("has every command id of the plan", () => {
    expect(markdownCommands.map((c) => c.id).sort()).toEqual([...EXPECTED_IDS].sort());
  });
  it("does not clash with the ids of the other commands", () => {
    // register() throws on a duplicate. Building the registry above is the check.
    expect(registry.list().length).toBe(appCommands.length + editorCommands.length + markdownCommands.length);
  });
  it("gives each command a title", () => {
    for (const c of markdownCommands) expect(c.title.length).toBeGreaterThan(2);
  });
  it("does nothing without a view", async () => {
    await expect(registry.run("format.bold", { view: null, app: {} as AppActions })).resolves.toBe(true);
  });

  it("runs commands through the registry", async () => {
    expect(await run("format.bold", "⟦a⟧")).toBe("**⟦a⟧**");
    expect(await run("heading.set2", "¦a")).toBe("## ¦a");
    expect(await run("list.bullet", "⟦a\nb⟧")).toBe("- ⟦a\n- b⟧");
    expect(await run("task.toggle", "- [ ] ¦a")).toBe("- [x] ¦a");
    expect(await run("block.quote", "¦a")).toBe("> ¦a");
    expect(await run("table.format", "| a¦ |\n|-|")).toBe("| a¦   |\n| --- |");
    expect(await run("list.renumber", "1. a\n3. b¦")).toBe("1. a\n2. b¦");
  });
});

describe("markdownKeymap", () => {
  it("names only commands that exist", () => {
    expect(markdownKeymap.filter((b) => !registry.has(b.command))).toEqual([]);
  });
  it("works only when the editor has focus", () => {
    expect(markdownKeymap.every((b) => b.when === "editorFocus")).toBe(true);
  });
  it("parses on every platform", () => {
    expect(compileLayers([markdownKeymap], false).errors).toEqual([]);
    expect(compileLayers([markdownKeymap], true).errors).toEqual([]);
  });
  it.each([false, true])("has no duplicate key with the default keymap (mac: %s)", (isMac) => {
    const { bindings } = compileLayers([defaultKeymap, markdownKeymap], isMac);
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const b of bindings) {
      const id = `${b.strokes.join(" ")} [${b.when ?? ""}]`;
      if (seen.has(id)) dups.push(`${id}: ${seen.get(id)} and ${b.command}`);
      seen.set(id, b.command);
    }
    expect(dups).toEqual([]);
  });
  it("keeps Ctrl+K free as a chord prefix", () => {
    const { bindings } = compileLayers([defaultKeymap, markdownKeymap], false);
    expect(bindings.filter((b) => b.strokes[0] === "ctrl+k")).toEqual([]);
  });
  it("binds the link command to Ctrl+Alt+K", () => {
    const b = compileLayers([markdownKeymap], false).bindings.find((x) => x.command === "format.link");
    expect(b?.strokes).toEqual(["ctrl+alt+k"]);
  });
  it("binds Enter, Tab and Shift+Tab", () => {
    const keys = compileLayers([markdownKeymap], false).bindings.map((b) => `${b.strokes.join(" ")}=${b.command}`);
    expect(keys).toEqual(expect.arrayContaining(["enter=edit.enter", "tab=edit.tab", "shift+tab=edit.shiftTab"]));
  });
});

describe("enterKey", () => {
  it("continues a list as one undo step, with the numbers fixed", () => {
    const v = fakeView("1. a¦\n2. b");
    expect(enterKey(asView(v))).toBe(true);
    expect(v.history).toEqual(["1. a\n2. ¦\n3. b"]);
  });
  it("makes a normal new line elsewhere", () => {
    const v = fakeView("abc¦");
    enterKey(asView(v));
    expect(v.history).toEqual(["abc\n¦"]);
  });
  it("keeps the indent on a normal new line", () => {
    const v = fakeView("  abc¦");
    enterKey(asView(v));
    expect(v.history).toEqual(["  abc\n  ¦"]);
  });
  it("replaces a selection with a new line", () => {
    const v = fakeView("a⟦bc⟧d");
    enterKey(asView(v));
    expect(v.history).toEqual(["a\n¦d"]);
  });
});

describe("tabKey and shiftTabKey", () => {
  it("goes to the next cell in a table", () => {
    const v = fakeView("| a¦ | b |\n|-|-|");
    tabKey(asView(v));
    expect(v.history).toEqual(["| a   | ⟦b⟧   |\n| --- | --- |"]);
  });
  it("nests a list item, and fixes the numbers, in one step", () => {
    const v = fakeView("1. a\n2. ¦b\n3. c");
    tabKey(asView(v));
    expect(v.history).toEqual(["1. a\n   1. ¦b\n2. c"]);
  });
  it("inserts two spaces at a cursor in a paragraph", () => {
    const v = fakeView("a¦b");
    tabKey(asView(v));
    expect(v.history).toEqual(["a  ¦b"]);
  });
  it("inserts two spaces at every cursor", () => {
    const v = fakeView("a¦\nb¦");
    tabKey(asView(v));
    expect(v.history).toEqual(["a  ¦\nb  ¦"]);
  });
  it("indents the lines of a selection that is not in a list", () => {
    const v = fakeView("⟦a\nb⟧");
    tabKey(asView(v));
    expect(v.history).toEqual(["  ⟦a\n  b⟧"]);
  });
  it("goes to the previous cell with Shift+Tab", () => {
    const v = fakeView("| a | b¦ |\n|-|-|");
    shiftTabKey(asView(v));
    expect(v.history).toEqual(["| ⟦a⟧   | b   |\n| --- | --- |"]);
  });
  it("moves a list item out with Shift+Tab", () => {
    const v = fakeView("- a\n  - ¦b");
    shiftTabKey(asView(v));
    expect(v.history).toEqual(["- a\n- ¦b"]);
  });
  it("outdents a paragraph with Shift+Tab", () => {
    const v = fakeView("  ¦a");
    shiftTabKey(asView(v));
    expect(v.history).toEqual(["¦a"]);
  });
});

describe("format.link", () => {
  afterEach(() => vi.unstubAllGlobals());
  const clipboard = (read: () => Promise<string>) => vi.stubGlobal("navigator", { clipboard: { readText: read } });

  it("uses a URL from the clipboard", async () => {
    clipboard(async () => "https://example.com/x");
    expect(await run("format.link", "⟦text⟧")).toBe("[text](https://example.com/x)¦");
  });
  it("ignores clipboard text that is not a URL", async () => {
    clipboard(async () => "just some words");
    expect(await run("format.link", "⟦text⟧")).toBe("[text](¦)");
  });
  it("works when the clipboard is refused", async () => {
    clipboard(async () => {
      throw new Error("denied");
    });
    expect(await run("format.link", "⟦text⟧")).toBe("[text](¦)");
  });
  it("works when there is no clipboard", async () => {
    vi.stubGlobal("navigator", {});
    expect(await run("format.link", "⟦text⟧")).toBe("[text](¦)");
  });
});
