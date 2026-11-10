// The menu bar. These menus are written by hand for now: the owner will
// decide their content later. An item names a command id. Its label comes from
// the command, and its keys come from the keymap, so a menu never drifts from
// the commands. `menus.test.ts` checks that every id exists.

export type MenuItem = { command: string; label?: string } | { separator: true };

export interface Menu {
  id: string;
  label: string;
  items: MenuItem[];
}

const sep: MenuItem = { separator: true };

export const menus: Menu[] = [
  {
    id: "file",
    label: "File",
    items: [
      { command: "file.new" },
      { command: "file.open" },
      sep,
      { command: "file.save" },
      { command: "file.saveAs" },
      sep,
      { command: "export.html" },
      { command: "export.pdf" },
      sep,
      { command: "tab.close" },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    items: [
      { command: "edit.undo" },
      { command: "edit.redo" },
      sep,
      { command: "edit.selectAll" },
      { command: "edit.copyAsRichText" },
      sep,
      { command: "comment.toggleLine" },
      { command: "indent.more" },
      { command: "indent.less" },
    ],
  },
  {
    id: "selection",
    label: "Selection",
    items: [
      { command: "selection.addNextOccurrence" },
      { command: "selection.selectAllOccurrences" },
      { command: "selection.line" },
      sep,
      { command: "cursor.addAbove" },
      { command: "cursor.addBelow" },
      { command: "cursor.undo" },
      sep,
      { command: "lines.moveUp" },
      { command: "lines.moveDown" },
      { command: "lines.copyUp" },
      { command: "lines.copyDown" },
      { command: "lines.duplicate" },
      { command: "lines.delete" },
    ],
  },
  { id: "find", label: "Find", items: [] },
  {
    id: "view",
    label: "View",
    items: [
      { command: "view.source" },
      { command: "view.split" },
      { command: "view.preview" },
      { command: "view.cycleMode" },
      sep,
      { command: "view.toggleOutline" },
      { command: "view.toggleMenuBar" },
      { command: "view.toggleTheme" },
      sep,
      { command: "fold.fold" },
      { command: "fold.unfold" },
      { command: "fold.foldAll" },
      { command: "fold.unfoldAll" },
    ],
  },
  {
    id: "goto",
    label: "Goto",
    items: [{ command: "bracket.jumpToMatch" }, sep, { command: "tab.next" }, { command: "tab.previous" }],
  },
  { id: "tools", label: "Tools", items: [] },
  { id: "project", label: "Project", items: [] },
  { id: "preferences", label: "Preferences", items: [] },
  { id: "help", label: "Help", items: [] },
];
