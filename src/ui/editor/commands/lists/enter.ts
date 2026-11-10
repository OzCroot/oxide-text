import { EditorSelection, type EditorState } from "@codemirror/state";
import { docLines, type Edit } from "../shared";
import { listBlockAround, parseListLine, parseQuoteLine } from "./model";
import { thenRenumber } from "./renumber";

/**
 * Enter in a list item or a blockquote.
 * - A list item with text: start a new item. A numbered item gets the next number, and the
 *   items after it are renumbered. A task item starts a new open task.
 * - An empty list item or quote line: remove the marker, and leave an empty line.
 * - A quote line with text: start a new quote line.
 * Returns null if no cursor is in a list item or a quote, or if any selection is not empty.
 * The caller then uses the normal newline.
 */
export const listEnter: Edit = (state: EditorState) => {
  if (state.selection.ranges.some((r) => !r.empty)) return null;
  let handled = false;
  let numbered = false;

  const spec = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.head);
    const col = range.head - line.from;

    const item = parseListLine(line.text);
    if (item) {
      const markerEnd = item.indent.length + item.marker.length;
      if (item.rest.trim() === "" && col >= markerEnd) {
        handled = true;
        return { changes: { from: line.from, to: line.to }, range: EditorSelection.cursor(line.from) };
      }
      if (col >= item.textFrom) {
        handled = true;
        const next = item.ordered ? `${item.number + 1}${item.delim}` : item.marker;
        if (item.ordered) numbered = true;
        const insert = `\n${item.indent}${next}${item.gap === "" ? " " : item.gap}${item.task !== null ? "[ ] " : ""}`;
        return {
          changes: { from: range.head, insert },
          range: EditorSelection.cursor(range.head + insert.length),
        };
      }
    }

    const quote = parseQuoteLine(line.text);
    if (quote && col >= quote.prefix.length) {
      handled = true;
      if (quote.rest.trim() === "") {
        return { changes: { from: line.from, to: line.to }, range: EditorSelection.cursor(line.from) };
      }
      const prefix = /\s$/.test(quote.prefix) ? quote.prefix : quote.prefix + " ";
      const insert = "\n" + prefix;
      return { changes: { from: range.head, insert }, range: EditorSelection.cursor(range.head + insert.length) };
    }

    // Not a list or a quote: a new line with the same indent.
    const indent = /^[ \t]*/.exec(line.text)![0].slice(0, col);
    const insert = "\n" + indent;
    return { changes: { from: range.head, insert }, range: EditorSelection.cursor(range.head + insert.length) };
  });

  if (!handled) return null;
  if (numbered && state.selection.ranges.length === 1) {
    // Renumber the items after the new one.
    return thenRenumber(state, spec, (after) => {
      const n = after.doc.lineAt(after.selection.main.head).number;
      const block = listBlockAround(docLines(after.doc), n);
      return block ? [n, block[1]] : null;
    });
  }
  return spec;
};
