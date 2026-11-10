// Helpers for the tests of the Markdown commands. This file is not a test.
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState, Transaction, type TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { EditorLike } from "./shared";

// ¦ marks a cursor. ⟦ and ⟧ mark a selection. Markdown uses | and >, so we use other characters.
const CURSOR = "¦";
const OPEN = "⟦";
const CLOSE = "⟧";

export function parseDoc(marked: string): { doc: string; ranges: { anchor: number; head: number }[] } {
  let doc = "";
  const ranges: { anchor: number; head: number }[] = [];
  let selStart = -1;
  for (const ch of marked) {
    if (ch === CURSOR) ranges.push({ anchor: doc.length, head: doc.length });
    else if (ch === OPEN) selStart = doc.length;
    else if (ch === CLOSE) {
      ranges.push({ anchor: selStart, head: doc.length });
      selStart = -1;
    } else doc += ch;
  }
  return { doc, ranges };
}

/** Make a state from text with ¦ and ⟦ ⟧ markers. Without a marker the cursor is at the start. */
export function stateOf(marked: string, withMarkdown = true): EditorState {
  const { doc, ranges } = parseDoc(marked);
  return EditorState.create({
    doc,
    selection: ranges.length ? EditorSelection.create(ranges.map((r) => EditorSelection.range(r.anchor, r.head))) : undefined,
    extensions: [EditorState.allowMultipleSelections.of(true), ...(withMarkdown ? [markdown({ base: markdownLanguage })] : [])],
  });
}

/** Text with the selection markers put back in. */
export function render(state: EditorState): string {
  const marks: { pos: number; text: string; order: number }[] = [];
  for (const r of state.selection.ranges) {
    if (r.empty) marks.push({ pos: r.from, text: CURSOR, order: 1 });
    else {
      marks.push({ pos: r.from, text: OPEN, order: 0 });
      marks.push({ pos: r.to, text: CLOSE, order: 2 });
    }
  }
  marks.sort((a, b) => a.pos - b.pos || a.order - b.order);
  const doc = state.doc.toString();
  let out = "";
  let last = 0;
  for (const m of marks) {
    out += doc.slice(last, m.pos) + m.text;
    last = m.pos;
  }
  return out + doc.slice(last);
}

/** Run an edit on marked text, and give the marked result. Returns the input if the edit does nothing. */
export function runEdit(marked: string, edit: (s: EditorState) => TransactionSpec | null, withMarkdown = true): string {
  const s = stateOf(marked, withMarkdown);
  const spec = edit(s);
  return render(spec ? s.update(spec).state : s);
}

/** A fake view for the commands that take a view. */
export function fakeView(marked: string, withMarkdown = true): EditorLike & { history: string[] } {
  const view = {
    state: stateOf(marked, withMarkdown),
    history: [] as string[],
    dispatch(...specs: (TransactionSpec | Transaction)[]) {
      const first = specs[0];
      view.state = first instanceof Transaction ? first.state : view.state.update(...(specs as TransactionSpec[])).state;
      view.history.push(render(view.state));
    },
  };
  return view as unknown as EditorLike & { history: string[] };
}

export const asView = (v: EditorLike): EditorView => v as unknown as EditorView;
