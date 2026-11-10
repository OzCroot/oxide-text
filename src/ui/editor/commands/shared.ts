import type { ChangeSet, ChangeSpec, EditorState, Text, TransactionSpec } from "@codemirror/state";

/** The part of an `EditorView` that the commands use. Tests pass a small fake. */
export interface EditorLike {
  readonly state: EditorState;
  dispatch(...specs: TransactionSpec[]): void;
}

/** A pure edit: read the state, and return a transaction, or null for "nothing to do". */
export type Edit = (state: EditorState) => TransactionSpec | null;

/** Run an edit on a view as one undo step. Returns false if the edit did nothing. */
export function applyEdit(view: EditorLike, edit: Edit): boolean {
  const spec = edit(view.state);
  if (!spec) return false;
  view.dispatch({ scrollIntoView: true, userEvent: "input", ...spec });
  return true;
}

/**
 * A transaction for a list of changes in the coordinates of the current
 * document. A cursor at the start of an insert moves after the inserted text.
 */
export function changesSpec(state: EditorState, changes: ChangeSpec[]): TransactionSpec | null {
  if (changes.length === 0) return null;
  const cs: ChangeSet = state.changes(changes);
  if (cs.empty) return null;
  return { changes: cs, selection: state.selection.map(cs, 1) };
}

/** The line numbers (1-based) that the selection covers, without duplicates, in order. */
export function selectedLineNumbers(state: EditorState): number[] {
  const set = new Set<number>();
  for (const r of state.selection.ranges) {
    const a = state.doc.lineAt(r.from).number;
    let b = state.doc.lineAt(r.to).number;
    // A selection that ends at the start of a line does not cover that line.
    if (!r.empty && b > a && state.doc.line(b).from === r.to) b--;
    for (let n = a; n <= b; n++) set.add(n);
  }
  return [...set].sort((x, y) => x - y);
}

/** Lines as a function, so the same code works on a document and on an array. */
export interface LineSource {
  readonly count: number;
  get(n: number): string;
}

export const docLines = (doc: Text): LineSource => ({ count: doc.lines, get: (n) => doc.line(n).text });

export const arrayLines = (lines: readonly string[]): LineSource => ({
  count: lines.length,
  get: (n) => lines[n - 1] ?? "",
});

export const isBlank = (s: string): boolean => s.trim() === "";

/** The width of leading whitespace in columns. A tab goes to the next multiple of 4. */
export function indentWidth(ws: string): number {
  let w = 0;
  for (const c of ws) w += c === "\t" ? 4 - (w % 4) : 1;
  return w;
}

export function leadingWhitespace(s: string): string {
  return /^[ \t]*/.exec(s)![0];
}

export interface Fence {
  /** The line number of the opening fence. */
  open: number;
  /** The line number of the closing fence, or null if the block runs to the end. */
  close: number | null;
  char: string;
  length: number;
}

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

/** The fenced code blocks of a document. */
export function findFences(src: LineSource): Fence[] {
  const out: Fence[] = [];
  let cur: Fence | null = null;
  for (let n = 1; n <= src.count; n++) {
    const t = src.get(n);
    if (!cur) {
      const m = FENCE_OPEN.exec(t);
      // The info string of a backtick fence cannot hold a backtick.
      if (m && !(m[1]![0] === "`" && m[2]!.includes("`"))) {
        cur = { open: n, close: null, char: m[1]![0]!, length: m[1]!.length };
        out.push(cur);
      }
    } else {
      const m = FENCE_CLOSE.exec(t);
      if (m && m[1]![0] === cur.char && m[1]!.length >= cur.length) {
        cur.close = n;
        cur = null;
      }
    }
  }
  return out;
}

/** `mask[n]` is true if line n is inside a fenced code block, or is a fence line. */
export function fenceMask(src: LineSource): boolean[] {
  const mask = new Array<boolean>(src.count + 2).fill(false);
  for (const f of findFences(src)) {
    for (let n = f.open; n <= (f.close ?? src.count); n++) mask[n] = true;
  }
  return mask;
}
