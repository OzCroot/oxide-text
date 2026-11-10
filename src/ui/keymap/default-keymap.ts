import type { Binding } from "./resolver";

// The default keymap follows VS Code and Sublime Text.
// See plan/OXIDE-TEXT-PLAN.md, section 7.1. "mod" is Ctrl, or Cmd on macOS.
// Every binding names a command id. The user can change all of them.
export const defaultKeymap: Binding[] = [
  // Files and tabs
  { key: "mod+n", command: "file.new" },
  { key: "mod+o", command: "file.open" },
  { key: "mod+s", command: "file.save" },
  { key: "mod+shift+s", command: "file.saveAs" },
  { key: "mod+w", command: "tab.close" },
  { key: "ctrl+tab", command: "tab.next" },
  { key: "ctrl+shift+tab", command: "tab.previous" },

  // Views, outline, export
  { key: "mod+shift+v", command: "view.cycleMode" },
  { key: "mod+alt+o", command: "view.toggleOutline" },
  { key: "mod+alt+e", command: "export.html" },
  { key: "mod+alt+p", command: "export.pdf" },
  { key: "mod+alt+shift+c", command: "edit.copyAsRichText" },

  // Editing
  { key: "mod+z", command: "edit.undo", when: "editorFocus" },
  { key: "mod+shift+z", command: "edit.redo", when: "editorFocus" },
  { key: "mod+y", command: "edit.redo", when: "editorFocus" },
  { key: "mod+a", command: "edit.selectAll", when: "editorFocus" },

  // Selection and cursors
  { key: "mod+d", command: "selection.addNextOccurrence", when: "editorFocus" },
  { key: "mod+shift+l", command: "selection.selectAllOccurrences", when: "editorFocus" },
  { key: "mod+l", command: "selection.line", when: "editorFocus" },
  { key: "mod+alt+up", command: "cursor.addAbove", when: "editorFocus" },
  { key: "mod+alt+down", command: "cursor.addBelow", when: "editorFocus" },
  { key: "mod+u", command: "cursor.undo", when: "editorFocus" },

  // Lines
  { key: "alt+up", command: "lines.moveUp", when: "editorFocus" },
  { key: "alt+down", command: "lines.moveDown", when: "editorFocus" },
  { key: "shift+alt+up", command: "lines.copyUp", when: "editorFocus" },
  { key: "shift+alt+down", command: "lines.copyDown", when: "editorFocus" },
  { key: "mod+shift+d", command: "lines.duplicate", when: "editorFocus" },
  { key: "mod+shift+k", command: "lines.delete", when: "editorFocus" },
  { key: "mod+enter", command: "lines.insertBelow", when: "editorFocus" },
  { key: "mod+shift+enter", command: "lines.insertAbove", when: "editorFocus" },

  // Indent, comment, brackets
  { key: "mod+]", command: "indent.more", when: "editorFocus" },
  { key: "mod+[", command: "indent.less", when: "editorFocus" },
  { key: "mod+/", command: "comment.toggleLine", when: "editorFocus" },
  { key: "mod+shift+\\", command: "bracket.jumpToMatch", when: "editorFocus" },
  { key: "mod+shift+[", command: "fold.fold", when: "editorFocus" },
  { key: "mod+shift+]", command: "fold.unfold", when: "editorFocus" },
];
