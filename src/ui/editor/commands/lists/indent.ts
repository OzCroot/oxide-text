import type { ChangeSpec, EditorState } from "@codemirror/state";
import { changesSpec, docLines, indentWidth, isBlank, leadingWhitespace, selectedLineNumbers, type Edit, type LineSource } from "../shared";
import { listBlockAround, parseListLine } from "./model";
import { thenRenumber } from "./renumber";

/**
 * How many columns to indent item `n` so that it nests under the item above it.
 * A child must start at the content column of its parent, so it is 2 under "- " and 3 under "1. ".
 */
function indentDelta(src: LineSource, n: number): { delta: number; firstChild: boolean } {
  const width = indentWidth(leadingWhitespace(src.get(n)));
  let deeper = false;
  for (let j = n - 1; j >= 1; j--) {
    const t = src.get(j);
    if (isBlank(t)) continue;
    const item = parseListLine(t);
    if (!item) {
      if (leadingWhitespace(t) !== "") continue; // A continuation of an item above.
      break;
    }
    const w = indentWidth(item.indent);
    // The item above at the same level is the parent. If it has no sub-items yet, this item is the first.
    if (w === width) return { delta: item.contentCol - w, firstChild: !deeper };
    if (w < width) break;
    deeper = true;
  }
  return { delta: 2, firstChild: false };
}

/** How many columns to outdent item `n`: up to the level of its parent item. */
function outdentCols(src: LineSource, n: number): number {
  const width = indentWidth(leadingWhitespace(src.get(n)));
  for (let j = n - 1; j >= 1; j--) {
    const t = src.get(j);
    if (isBlank(t)) continue;
    const item = parseListLine(t);
    if (!item) {
      if (leadingWhitespace(t) !== "") continue;
      break;
    }
    const w = indentWidth(item.indent);
    if (w < width) return width - w;
  }
  return width;
}

/** The number of characters at the start of `indent` that hold `cols` columns. */
function charsForCols(indent: string, cols: number): number {
  let width = 0;
  let chars = 0;
  for (const c of indent) {
    if (width >= cols) break;
    width += c === "\t" ? 4 - (width % 4) : 1;
    chars++;
  }
  return chars;
}

/** The lines below item `n` that are deeper than it. They move with it. */
function subtree(src: LineSource, n: number): number[] {
  const width = indentWidth(leadingWhitespace(src.get(n)));
  const out: number[] = [];
  for (let k = n + 1; k <= src.count; k++) {
    const t = src.get(k);
    if (isBlank(t)) {
      let next = k + 1;
      while (next <= src.count && isBlank(src.get(next))) next++;
      if (next <= src.count && indentWidth(leadingWhitespace(src.get(next))) > width) continue;
      break;
    }
    if (indentWidth(leadingWhitespace(t)) > width) out.push(k);
    else break;
  }
  return out;
}

function shift(state: EditorState, direction: 1 | -1): ReturnType<Edit> {
  const src = docLines(state.doc);
  const items = selectedLineNumbers(state).filter((n) => parseListLine(state.doc.line(n).text));
  if (items.length === 0) return null;

  const cursorOnly = state.selection.ranges.every((r) => r.empty);
  const lines = new Set<number>(items);
  // With only cursors, an item takes its sub-items with it.
  if (cursorOnly) for (const n of items) for (const k of subtree(src, n)) lines.add(k);

  const first = items[0]!;
  const moved = direction > 0 ? indentDelta(src, first) : null;
  const delta = moved ? moved.delta : outdentCols(src, first);
  if (delta <= 0) return null;

  const changes: ChangeSpec[] = [];
  // The first item of a new nested numbered list starts again at 1.
  const firstItem = parseListLine(state.doc.line(first).text);
  if (moved?.firstChild && firstItem?.ordered && firstItem.number !== 1) {
    const from = state.doc.line(first).from + firstItem.indent.length;
    changes.push({ from, to: from + String(firstItem.number).length, insert: "1" });
  }
  for (const n of lines) {
    const line = state.doc.line(n);
    if (isBlank(line.text)) continue;
    if (direction > 0) {
      changes.push({ from: line.from, insert: " ".repeat(delta) });
    } else {
      const chars = charsForCols(leadingWhitespace(line.text), delta);
      if (chars > 0) changes.push({ from: line.from, to: line.from + chars });
    }
  }
  const spec = changesSpec(state, changes);
  if (!spec) return null;
  // The numbers of an ordered list can be wrong after a move.
  return thenRenumber(state, spec, (after) => listBlockAround(docLines(after.doc), first));
}

/** Nest the selected list items one level deeper. Null if no selected line is a list item. */
export const listIndent: Edit = (state) => shift(state, 1);

/** Move the selected list items one level out. Null if no selected line is a list item, or all are at the top. */
export const listOutdent: Edit = (state) => shift(state, -1);
