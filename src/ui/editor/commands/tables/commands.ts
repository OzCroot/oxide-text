import { EditorSelection, type EditorState } from "@codemirror/state";
import { changesSpec, docLines, selectedLineNumbers, type Edit } from "../shared";
import {
  cellContentRange,
  cellIndexAt,
  columnCount,
  findTableAt,
  findTables,
  formatTable,
  type Align,
  type LocatedTable,
  type Table,
} from "./model";

/** A row of a table: 0 is the header, 1 is the delimiter row, 2 and up are body rows. */
interface Target {
  row: number;
  col: number;
  /** "start": cursor at the start of the text. "select": select the text. "offset": keep `offset`. */
  mode: "start" | "select" | "offset";
  offset?: number;
}

interface Where {
  located: LocatedTable;
  row: number;
  col: number;
  /** The offset of the cursor inside the text of its cell. */
  offsetInCell: number;
}

function whereIsCursor(state: EditorState): Where | null {
  const main = state.selection.main;
  if (!main.empty) return null;
  const src = docLines(state.doc);
  const line = state.doc.lineAt(main.head);
  const located = findTableAt(src, line.number);
  if (!located) return null;
  const col = cellIndexAt(line.text, main.head - line.from);
  const range = cellContentRange(line.text, col);
  const offsetInCell = Math.max(0, Math.min(main.head - line.from - range.from, range.to - range.from));
  return { located, row: line.number - located.first, col, offsetInCell };
}

/** Replace the table with `table` and put the cursor at `target`. Null if nothing changes. */
function replaceTable(state: EditorState, located: LocatedTable, table: Table, target: Target): ReturnType<Edit> {
  const first = state.doc.line(located.first);
  const last = state.doc.line(located.last);
  const lines = formatTable(table);
  const rowIndex = Math.min(target.row, lines.length - 1);
  const col = Math.max(0, target.col);
  let offset = first.from;
  for (let i = 0; i < rowIndex; i++) offset += lines[i]!.length + 1;
  const range = cellContentRange(lines[rowIndex]!, col);
  const selection =
    target.mode === "select"
      ? EditorSelection.range(offset + range.from, offset + range.to)
      : EditorSelection.cursor(
          offset + (target.mode === "offset" ? Math.min(range.from + (target.offset ?? 0), range.to) : range.from),
        );
  const insert = lines.join("\n");
  const same = state.doc.sliceString(first.from, last.to) === insert;
  if (same && state.selection.eq(EditorSelection.create([selection]))) return null;
  return {
    changes: same ? undefined : { from: first.from, to: last.to, insert },
    selection,
  };
}

function cloneTable(t: Table): Table {
  return { indent: t.indent, header: [...t.header], align: [...t.align], body: t.body.map((r) => [...r]) };
}

/** Make every row have the same number of cells, so that insert and delete by column index work. */
function normalise(t: Table): Table {
  const cols = columnCount(t);
  return {
    indent: t.indent,
    header: Array.from({ length: cols }, (_, c) => t.header[c] ?? ""),
    align: Array.from({ length: cols }, (_, c) => t.align[c] ?? "none"),
    body: t.body.map((r) => Array.from({ length: cols }, (_, c) => r[c] ?? "")),
  };
}

/** Pad the table that holds the cursor. */
export const formatTableAtCursor: Edit = (state) => {
  const w = whereIsCursor(state);
  if (!w) return null;
  return replaceTable(state, w.located, w.located.table, { row: w.row, col: w.col, mode: "offset", offset: w.offsetInCell });
};

/** Pad every table that a selection touches. Null if no selection is in a table. */
export const formatTablesInSelection: Edit = (state) => {
  const src = docLines(state.doc);
  const lines = new Set(selectedLineNumbers(state));
  const tables = findTables(src).filter((t) => [...lines].some((n) => n >= t.first && n <= t.last));
  const changes = tables.flatMap((t) => {
    const first = state.doc.line(t.first);
    const last = state.doc.line(t.last);
    const insert = formatTable(t.table).join("\n");
    return state.doc.sliceString(first.from, last.to) === insert ? [] : [{ from: first.from, to: last.to, insert }];
  });
  return changesSpec(state, changes);
};

/** Insert an empty table with `cols` columns and `rows` body rows. The first header cell is selected. */
export function insertTable(cols = 3, rows = 2): Edit {
  return (state) => {
    const line = state.doc.lineAt(state.selection.main.head);
    const blank = line.text.trim() === "";
    const table: Table = {
      indent: "",
      header: Array.from({ length: cols }, (_, c) => `Column ${c + 1}`),
      align: Array.from({ length: cols }, () => "none" as Align),
      body: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")),
    };
    const text = formatTable(table).join("\n");
    // A table needs a blank line before it, or it joins the paragraph above.
    const prefix = blank ? "" : "\n\n";
    const at = blank ? line.from : line.to;
    const range = cellContentRange(text.split("\n")[0]!, 0);
    return {
      changes: { from: at, to: blank ? line.to : at, insert: prefix + text },
      selection: EditorSelection.range(at + prefix.length + range.from, at + prefix.length + range.to),
    };
  };
}

type Mutation = (t: Table, w: Where) => { table: Table; target: Target } | null;

function editTable(mutation: Mutation): Edit {
  return (state) => {
    const w = whereIsCursor(state);
    if (!w) return null;
    const result = mutation(normalise(w.located.table), w);
    if (!result) return null;
    return replaceTable(state, w.located, result.table, result.target);
  };
}

const emptyRow = (t: Table) => t.header.map(() => "");

export const addRowAbove: Edit = editTable((t, w) => {
  if (w.row < 2) return null; // Nothing goes above the header.
  const next = cloneTable(t);
  next.body.splice(w.row - 2, 0, emptyRow(t));
  return { table: next, target: { row: w.row, col: w.col, mode: "start" } };
});

export const addRowBelow: Edit = editTable((t, w) => {
  const at = w.row < 2 ? 0 : w.row - 1;
  const next = cloneTable(t);
  next.body.splice(at, 0, emptyRow(t));
  return { table: next, target: { row: 2 + at, col: w.col, mode: "start" } };
});

export const deleteRow: Edit = editTable((t, w) => {
  if (w.row < 2) return null; // The header and the delimiter row stay.
  const next = cloneTable(t);
  next.body.splice(w.row - 2, 1);
  const row = next.body.length === 0 ? 0 : Math.min(w.row, 1 + next.body.length);
  return { table: next, target: { row, col: w.col, mode: "start" } };
});

function addColumn(side: "left" | "right"): Edit {
  return editTable((t, w) => {
    const at = side === "left" ? w.col : w.col + 1;
    const next = cloneTable(t);
    next.header.splice(at, 0, "");
    next.align.splice(at, 0, "none");
    for (const r of next.body) r.splice(at, 0, "");
    return { table: next, target: { row: w.row === 1 ? 0 : w.row, col: at, mode: "start" } };
  });
}

export const addColumnLeft: Edit = addColumn("left");
export const addColumnRight: Edit = addColumn("right");

export const deleteColumn: Edit = editTable((t, w) => {
  if (t.header.length <= 1) return null; // A table needs a column.
  const next = cloneTable(t);
  next.header.splice(w.col, 1);
  next.align.splice(w.col, 1);
  for (const r of next.body) r.splice(w.col, 1);
  return { table: next, target: { row: w.row === 1 ? 0 : w.row, col: Math.min(w.col, next.header.length - 1), mode: "start" } };
});

function setAlign(align: Align): Edit {
  return editTable((t, w) => {
    const next = cloneTable(t);
    next.align[w.col] = align;
    return { table: next, target: { row: w.row, col: w.col, mode: "offset", offset: w.offsetInCell } };
  });
}

export const alignLeft: Edit = setAlign("left");
export const alignCenter: Edit = setAlign("center");
export const alignRight: Edit = setAlign("right");

/**
 * Tab in a table: pad the table, and select the next cell.
 * At the last cell it adds a row. Null if the cursor is not in a table.
 */
export const tableNextCell: Edit = editTable((t, w) => {
  const cols = t.header.length;
  if (w.col < cols - 1) return { table: t, target: { row: w.row === 1 ? 2 : w.row, col: w.col + 1, mode: "select" } };
  // The last cell of the row: go to the first cell of the next row.
  if (w.row < 2) {
    if (t.body.length === 0) {
      const next = cloneTable(t);
      next.body.push(emptyRow(t));
      return { table: next, target: { row: 2, col: 0, mode: "start" } };
    }
    return { table: t, target: { row: 2, col: 0, mode: "select" } };
  }
  if (w.row - 2 < t.body.length - 1) return { table: t, target: { row: w.row + 1, col: 0, mode: "select" } };
  const next = cloneTable(t);
  next.body.push(emptyRow(t));
  return { table: next, target: { row: w.row + 1, col: 0, mode: "start" } };
});

/** Shift+Tab in a table: pad the table, and select the previous cell. */
export const tablePreviousCell: Edit = editTable((t, w) => {
  const cols = t.header.length;
  if (w.col > 0) return { table: t, target: { row: w.row === 1 ? 0 : w.row, col: w.col - 1, mode: "select" } };
  if (w.row >= 3) return { table: t, target: { row: w.row - 1, col: cols - 1, mode: "select" } };
  if (w.row === 2) return { table: t, target: { row: 0, col: cols - 1, mode: "select" } };
  return { table: t, target: { row: 0, col: 0, mode: "select" } };
});

/** True if the cursor is in a table. */
export function inTable(state: EditorState): boolean {
  return whereIsCursor(state) !== null;
}
