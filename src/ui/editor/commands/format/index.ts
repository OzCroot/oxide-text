import { EditorSelection, type ChangeSpec, type EditorState, type Text } from "@codemirror/state";
import type { Edit } from "../shared";

/** The inline markers. Italic uses `*`, so it also works inside a word. */
export const MARKERS = {
  bold: "**",
  italic: "*",
  strikethrough: "~~",
  code: "`",
} as const;

function runBefore(doc: Text, pos: number, ch: string): number {
  let n = 0;
  while (n < 6 && pos - n - 1 >= 0 && doc.sliceString(pos - n - 1, pos - n) === ch) n++;
  return n;
}

function runAfter(doc: Text, pos: number, ch: string): number {
  let n = 0;
  while (n < 6 && pos + n < doc.length && doc.sliceString(pos + n, pos + n + 1) === ch) n++;
  return n;
}

function leadingRun(text: string, ch: string): number {
  let n = 0;
  while (n < text.length && text[n] === ch) n++;
  return n;
}

function trailingRun(text: string, ch: string): number {
  let n = 0;
  while (n < text.length && text[text.length - 1 - n] === ch) n++;
  return n;
}

/**
 * Is the marker there, given the runs of its character on each side?
 * `*` is italic with an odd run (`***x***` is bold and italic).
 * Other markers need a run as long as the marker.
 */
function present(marker: string, before: number, after: number): boolean {
  const m = Math.min(before, after);
  if (marker.length === 1) return marker === "*" ? m % 2 === 1 : m >= 1;
  return m >= marker.length;
}

interface Wrapped {
  changes: ChangeSpec;
  /** Where the target text is after the change. */
  from: number;
  to: number;
}

function toggleAround(state: EditorState, from: number, to: number, marker: string): Wrapped {
  const doc = state.doc;
  const n = marker.length;
  const ch = marker[0]!;

  // The selected text includes the markers: **bold**
  if (to > from) {
    const text = doc.sliceString(from, to);
    const lr = leadingRun(text, ch);
    const tr = trailingRun(text, ch);
    if (lr < text.length && present(marker, lr, tr)) {
      return {
        changes: [
          { from, to: from + n },
          { from: to - n, to },
        ],
        from,
        to: to - 2 * n,
      };
    }
  }

  // The markers are just outside the selection.
  if (present(marker, runBefore(doc, from, ch), runAfter(doc, to, ch))) {
    return {
      changes: [
        { from: from - n, to: from },
        { from: to, to: to + n },
      ],
      from: from - n,
      to: to - n,
    };
  }

  // Add the markers.
  return {
    changes: from === to ? { from, insert: marker + marker } : [{ from, insert: marker }, { from: to, insert: marker }],
    from: from + n,
    to: to + n,
  };
}

/**
 * Toggle an inline marker around each selection. An empty selection in a word
 * uses the word. An empty selection elsewhere inserts a pair of markers.
 */
export function toggleMarker(marker: string): Edit {
  return (state) => {
    const spec = state.changeByRange((range) => {
      let { from, to } = range;
      if (range.empty) {
        const word = state.wordAt(range.head);
        if (word) ({ from, to } = word);
      }
      const w = toggleAround(state, from, to, marker);
      if (range.empty) {
        // Keep the cursor at the same place in the word. Between a new pair, go inside.
        const cursor = from === to ? w.from : range.head + (w.from - from);
        return { changes: w.changes, range: EditorSelection.cursor(cursor) };
      }
      return { changes: w.changes, range: EditorSelection.range(w.from, w.to) };
    });
    return spec;
  };
}

export const toggleBold = toggleMarker(MARKERS.bold);
export const toggleItalic = toggleMarker(MARKERS.italic);
export const toggleStrikethrough = toggleMarker(MARKERS.strikethrough);
export const toggleInlineCode = toggleMarker(MARKERS.code);

/** True if the text is a URL or an address that a link can use. */
export function looksLikeUrl(text: string): boolean {
  const t = text.trim();
  if (!t || /\s/.test(t)) return false;
  return /^[a-z][a-z0-9+.-]*:\S+$/i.test(t) || /^www\.\S+\.\S+$/i.test(t);
}

/**
 * Make a link of each selection.
 * - With `url`: `[selection](url)`. The cursor goes after it, or inside the empty brackets.
 * - Without `url`, if the selection is a URL: `[](selection)`, and the cursor goes in the brackets.
 * - Otherwise: `[selection]()`, and the cursor goes inside the parentheses.
 */
export function makeLink(url: string | null): Edit {
  return (state) =>
    state.changeByRange((range) => {
      let { from, to } = range;
      if (range.empty) {
        const word = state.wordAt(range.head);
        if (word) ({ from, to } = word);
      }
      const text = state.doc.sliceString(from, to);
      let insert: string;
      let cursor: number;
      if (url) {
        insert = `[${text}](${url})`;
        cursor = text === "" ? from + 1 : from + insert.length;
      } else if (text && looksLikeUrl(text)) {
        insert = `[](${text})`;
        cursor = from + 1;
      } else {
        insert = `[${text}]()`;
        cursor = text === "" ? from + 1 : from + 1 + text.length + 2;
      }
      return { changes: { from, to, insert }, range: EditorSelection.cursor(cursor) };
    });
}
