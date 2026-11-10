import { indentLess, indentMore, insertNewlineAndIndent } from "@codemirror/commands";
import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { insertRule, toggleCodeBlock, toggleQuote } from "@/editor/commands/blocks";
import { looksLikeUrl, makeLink, toggleBold, toggleInlineCode, toggleItalic, toggleStrikethrough } from "@/editor/commands/format";
import { clearHeading, headingDown, headingUp, setHeading } from "@/editor/commands/headings";
import { listEnter, listIndent, listOutdent, renumberList, toggleBullet, toggleNumbered, toggleTask, toggleTaskList } from "@/editor/commands/lists";
import { applyEdit, type Edit } from "@/editor/commands/shared";
import {
  addColumnLeft,
  addColumnRight,
  addRowAbove,
  addRowBelow,
  alignCenter,
  alignLeft,
  alignRight,
  deleteColumn,
  deleteRow,
  formatTableAtCursor,
  inTable,
  insertTable,
  tableNextCell,
  tablePreviousCell,
} from "@/editor/commands/tables";
import type { Binding } from "@/keymap/resolver";
import type { Command } from "./registry";

function edit(id: string, title: string, e: Edit): Command {
  return {
    id,
    title,
    run: ({ view }) => {
      if (view) applyEdit(view, e);
    },
  };
}

/** Run a command that needs the view itself, such as one that falls back to a CodeMirror command. */
function withView(id: string, title: string, fn: (view: EditorView) => boolean): Command {
  return {
    id,
    title,
    run: ({ view }) => {
      if (view) fn(view);
    },
  };
}

/** Enter: continue a list item or a quote. Everywhere else, a normal new line. */
export function enterKey(view: EditorView): boolean {
  return applyEdit(view, listEnter) || insertNewlineAndIndent(view);
}

/**
 * Tab: in a table, go to the next cell. In a list item, nest the item.
 * Elsewhere, indent the selected lines, or insert two spaces at a cursor.
 */
export function tabKey(view: EditorView): boolean {
  const state = view.state;
  const oneCursor = state.selection.ranges.length === 1 && state.selection.main.empty;
  if (oneCursor && inTable(state) && applyEdit(view, tableNextCell)) return true;
  if (applyEdit(view, listIndent)) return true;
  if (state.selection.ranges.every((r) => r.empty)) {
    return applyEdit(view, (s) =>
      s.changeByRange((r) => ({ changes: { from: r.head, insert: "  " }, range: EditorSelection.cursor(r.head + 2) })),
    );
  }
  return indentMore(view);
}

/** Shift+Tab: in a table, go to the previous cell. In a list item, move it out. Elsewhere, outdent. */
export function shiftTabKey(view: EditorView): boolean {
  const state = view.state;
  const oneCursor = state.selection.ranges.length === 1 && state.selection.main.empty;
  if (oneCursor && inTable(state) && applyEdit(view, tablePreviousCell)) return true;
  if (applyEdit(view, listOutdent)) return true;
  return indentLess(view);
}

/** The text of the clipboard if it is a URL. The clipboard can be unavailable or refused. */
async function clipboardUrl(): Promise<string | null> {
  try {
    const text = (await navigator.clipboard.readText()).trim();
    return looksLikeUrl(text) ? text : null;
  } catch {
    return null;
  }
}

export const markdownCommands: Command[] = [
  // Inline formatting
  edit("format.bold", "Bold", toggleBold),
  edit("format.italic", "Italic", toggleItalic),
  edit("format.strikethrough", "Strikethrough", toggleStrikethrough),
  edit("format.code", "Inline Code", toggleInlineCode),
  {
    id: "format.link",
    title: "Insert Link",
    // With a URL on the clipboard, the selection becomes the text of the link.
    run: async ({ view }) => {
      if (!view) return;
      const url = await clipboardUrl();
      applyEdit(view, makeLink(url));
    },
  },

  // Headings
  edit("heading.up", "Heading: Level Up (More Important)", headingUp),
  edit("heading.down", "Heading: Level Down (Less Important)", headingDown),
  edit("heading.set1", "Heading 1", setHeading(1)),
  edit("heading.set2", "Heading 2", setHeading(2)),
  edit("heading.set3", "Heading 3", setHeading(3)),
  edit("heading.set4", "Heading 4", setHeading(4)),
  edit("heading.set5", "Heading 5", setHeading(5)),
  edit("heading.set6", "Heading 6", setHeading(6)),
  edit("heading.clear", "Heading: Make Paragraph", clearHeading),

  // Lists
  edit("list.bullet", "Toggle Bullet List", toggleBullet),
  edit("list.numbered", "Toggle Numbered List", toggleNumbered),
  edit("list.task", "Toggle Task List", toggleTaskList),
  edit("list.renumber", "Renumber Ordered List", renumberList),
  edit("task.toggle", "Toggle Task Checkbox", toggleTask),

  // Blocks
  edit("block.quote", "Toggle Quote", toggleQuote),
  edit("block.codeBlock", "Toggle Code Block", toggleCodeBlock),
  edit("block.rule", "Insert Horizontal Rule", insertRule),

  // Tables
  edit("table.insert", "Insert Table", insertTable()),
  edit("table.addRowAbove", "Table: Add Row Above", addRowAbove),
  edit("table.addRowBelow", "Table: Add Row Below", addRowBelow),
  edit("table.deleteRow", "Table: Delete Row", deleteRow),
  edit("table.addColumnLeft", "Table: Add Column Left", addColumnLeft),
  edit("table.addColumnRight", "Table: Add Column Right", addColumnRight),
  edit("table.deleteColumn", "Table: Delete Column", deleteColumn),
  edit("table.alignLeft", "Table: Align Column Left", alignLeft),
  edit("table.alignCenter", "Table: Align Column Center", alignCenter),
  edit("table.alignRight", "Table: Align Column Right", alignRight),
  edit("table.format", "Table: Format (Pad Columns)", formatTableAtCursor),

  // Keys that change what they do in lists, quotes, and tables
  withView("edit.enter", "New Line (Continue List or Quote)", enterKey),
  withView("edit.tab", "Tab (Next Cell, Nest Item, Indent)", tabKey),
  withView("edit.shiftTab", "Shift+Tab (Previous Cell, Outdent)", shiftTabKey),
];

// Default keys. They do not clash with the keys in default-keymap.ts, and Ctrl+K stays free as a chord prefix.
// "mod" is Ctrl, or Cmd on macOS. Every key works only with the editor in focus.
// Commands with no key here (row and column edits, alignment, renumber) are for the launcher.
const keys: [string, string][] = [
  // Inline formatting: the usual keys of word processors, and GitHub for strikethrough and code.
  ["mod+b", "format.bold"],
  ["mod+i", "format.italic"],
  ["mod+shift+x", "format.strikethrough"],
  ["mod+e", "format.code"],
  // Ctrl+K is the chord prefix, so the link command uses Ctrl+Alt+K (plan section 3.3).
  ["mod+alt+k", "format.link"],

  // Headings: Ctrl+1 to 6 as in Typora. Ctrl+0 makes a paragraph.
  // Level up and down use Ctrl+Shift+. and Ctrl+Shift+, because Ctrl+Alt+Up and Down add cursors.
  ["mod+1", "heading.set1"],
  ["mod+2", "heading.set2"],
  ["mod+3", "heading.set3"],
  ["mod+4", "heading.set4"],
  ["mod+5", "heading.set5"],
  ["mod+6", "heading.set6"],
  ["mod+0", "heading.clear"],
  ["mod+shift+.", "heading.up"],
  ["mod+shift+,", "heading.down"],

  // Lists: the keys of Google Docs. Ctrl+Alt+T toggles the checkbox of a task.
  ["mod+shift+8", "list.bullet"],
  ["mod+shift+7", "list.numbered"],
  ["mod+shift+9", "list.task"],
  ["mod+alt+t", "task.toggle"],

  // Blocks. Ctrl+Shift+K is taken by "delete line", so the code block uses Ctrl+Alt+C.
  // Cmd+Shift+Q and Cmd+Alt+H are macOS system keys, so the quote uses Alt+Q and the rule uses Alt+R.
  ["mod+alt+q", "block.quote"],
  ["mod+alt+c", "block.codeBlock"],
  ["mod+alt+r", "block.rule"],

  // Tables
  ["mod+alt+shift+t", "table.insert"],
  ["mod+alt+f", "table.format"],

  // Keys that depend on the line. They fall back to the normal behaviour.
  ["enter", "edit.enter"],
  ["tab", "edit.tab"],
  ["shift+tab", "edit.shiftTab"],
];

export const markdownKeymap: Binding[] = keys.map(([key, command]) => ({ key, command, when: "editorFocus" }));
