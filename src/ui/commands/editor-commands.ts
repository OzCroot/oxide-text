import {
  addCursorAbove,
  addCursorBelow,
  copyLineDown,
  copyLineUp,
  deleteLine,
  cursorMatchingBracket,
  indentLess,
  indentMore,
  insertBlankLine,
  moveLineDown,
  moveLineUp,
  redo,
  selectAll,
  selectLine,
  toggleComment,
  undo,
  undoSelection,
} from "@codemirror/commands";
import { selectNextOccurrence, selectSelectionMatches } from "@codemirror/search";
import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { Command } from "./registry";

type CmCommand = (view: EditorView) => boolean;

function cm(id: string, title: string, fn: CmCommand): Command {
  return {
    id,
    title,
    run: ({ view }) => {
      if (view) fn(view);
    },
  };
}

/** Insert an empty line above each cursor line, and move the cursor to it. */
const insertLineAbove: CmCommand = (view) => {
  const state = view.state;
  view.dispatch(
    state.update(
      state.changeByRange((range) => {
        const line = state.doc.lineAt(range.head);
        return {
          changes: { from: line.from, insert: "\n" },
          range: EditorSelection.cursor(line.from),
        };
      }),
      { scrollIntoView: true, userEvent: "input" },
    ),
  );
  return true;
};

export const editorCommands: Command[] = [
  cm("edit.undo", "Undo", undo),
  cm("edit.redo", "Redo", redo),
  cm("edit.selectAll", "Select All", selectAll),

  cm("selection.addNextOccurrence", "Select Next Occurrence", selectNextOccurrence),
  cm("selection.selectAllOccurrences", "Select All Occurrences", selectSelectionMatches),
  cm("selection.line", "Select Line", selectLine),
  cm("cursor.addAbove", "Add Cursor Above", addCursorAbove),
  cm("cursor.addBelow", "Add Cursor Below", addCursorBelow),
  cm("cursor.undo", "Undo Last Cursor Move", undoSelection),

  cm("lines.moveUp", "Move Line Up", moveLineUp),
  cm("lines.moveDown", "Move Line Down", moveLineDown),
  cm("lines.copyUp", "Copy Line Up", copyLineUp),
  cm("lines.copyDown", "Copy Line Down", copyLineDown),
  cm("lines.duplicate", "Duplicate Line", copyLineDown),
  cm("lines.delete", "Delete Line", deleteLine),
  cm("lines.insertBelow", "Insert Line Below", insertBlankLine),
  cm("lines.insertAbove", "Insert Line Above", insertLineAbove),

  cm("indent.more", "Indent", indentMore),
  cm("indent.less", "Outdent", indentLess),
  cm("comment.toggleLine", "Toggle Comment", toggleComment),
  cm("bracket.jumpToMatch", "Jump to Matching Bracket", cursorMatchingBracket),
];
