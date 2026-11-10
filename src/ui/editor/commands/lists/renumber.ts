import type { ChangeSpec, EditorState, Text, TransactionSpec } from "@codemirror/state";
import { changesSpec, docLines, indentWidth, isBlank, selectedLineNumbers, type Edit } from "../shared";
import { listBlockAround, parseListLine } from "./model";

interface Level {
  indent: number;
  contentCol: number;
  /** The number the next ordered item gets, or null before the first item. */
  next: number | null;
}

/**
 * The changes that renumber the ordered items in lines `first` to `last`.
 * The first item of a list keeps its number. The others count up from it.
 * Each nesting level counts on its own.
 */
export function renumberChanges(doc: Text, first: number, last: number): ChangeSpec[] {
  const changes: ChangeSpec[] = [];
  const stack: Level[] = [];
  for (let n = first; n <= last; n++) {
    const line = doc.line(n);
    if (isBlank(line.text)) continue;
    const item = parseListLine(line.text);
    const width = indentWidth(/^[ \t]*/.exec(line.text)![0]);
    if (!item) {
      // A line that is not indented ends the list. An indented line belongs to the item above.
      while (stack.length && stack[stack.length - 1]!.indent >= width) stack.pop();
      continue;
    }
    while (stack.length && width < stack[stack.length - 1]!.indent) stack.pop();
    let level = stack[stack.length - 1];
    if (!level || width >= level.contentCol) {
      level = { indent: width, contentCol: item.contentCol, next: null };
      stack.push(level);
    }
    if (!item.ordered) {
      level.next = null;
      continue;
    }
    const expected = level.next ?? item.number;
    level.next = expected + 1;
    if (item.number !== expected) {
      const from = line.from + item.indent.length;
      changes.push({ from, to: from + String(item.number).length, insert: String(expected) });
    }
  }
  return changes;
}

/** Renumber the ordered lists in the selection, or the list around the cursor. */
export const renumberList: Edit = (state: EditorState) => {
  const src = docLines(state.doc);
  const lines = selectedLineNumbers(state);
  const empty = state.selection.ranges.every((r) => r.empty);
  const changes: ChangeSpec[] = [];
  if (empty) {
    const seen = new Set<number>();
    for (const n of lines) {
      const block = listBlockAround(src, n);
      if (!block || seen.has(block[0])) continue;
      seen.add(block[0]);
      changes.push(...renumberChanges(state.doc, block[0], block[1]));
    }
  } else {
    changes.push(...renumberChanges(state.doc, lines[0]!, lines[lines.length - 1]!));
  }
  return changesSpec(state, changes);
};

/**
 * Run `spec`, then renumber a range of the new document, as one transaction.
 * `pickRange` gets the state after `spec`, and returns the lines to renumber.
 */
export function thenRenumber(
  state: EditorState,
  spec: TransactionSpec,
  pickRange: (after: EditorState) => [number, number] | null,
): TransactionSpec {
  const tr = state.update(spec);
  const after = tr.state;
  const range = pickRange(after);
  if (!range) return spec;
  const extra = renumberChanges(after.doc, range[0], range[1]);
  if (extra.length === 0) return spec;
  const cs = after.changes(extra);
  return { changes: tr.changes.compose(cs), selection: after.selection.map(cs, 1) };
}
