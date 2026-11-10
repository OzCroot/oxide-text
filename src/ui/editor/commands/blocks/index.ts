import { EditorSelection, type ChangeSpec } from "@codemirror/state";
import { changesSpec, docLines, findFences, isBlank, selectedLineNumbers, type Edit } from "../shared";

const QUOTE_PREFIX = /^ {0,3}>[ \t]?/;

/**
 * Toggle a blockquote on the selected lines. If every non-blank line is already
 * quoted, remove one level of quote. Otherwise add `> ` to every line.
 */
export const toggleQuote: Edit = (state) => {
  const lines = selectedLineNumbers(state).map((n) => state.doc.line(n));
  const nonBlank = lines.filter((l) => !isBlank(l.text));
  const allQuoted = nonBlank.length > 0 && nonBlank.every((l) => QUOTE_PREFIX.test(l.text));
  const changes: ChangeSpec[] = [];
  if (allQuoted) {
    for (const l of nonBlank) {
      const m = QUOTE_PREFIX.exec(l.text)!;
      changes.push({ from: l.from, to: l.from + m[0].length });
    }
    return changesSpec(state, changes);
  }
  // Blank lines in the selection get a bare ">" so that the quote stays in one piece.
  const single = lines.length === 1;
  for (const l of lines) {
    changes.push({ from: l.from, insert: isBlank(l.text) && !single ? ">" : "> " });
  }
  return changesSpec(state, changes);
};

/** A fence that is longer than any run of backticks in the text. */
function fenceFor(text: string): string {
  let longest = 0;
  for (const m of text.matchAll(/`+/g)) longest = Math.max(longest, m[0].length);
  return "`".repeat(Math.max(3, longest + 1));
}

/**
 * Toggle a fenced code block.
 * - The cursor is inside a fenced block: remove the two fence lines.
 * - There is a selection: wrap the selected lines in fences.
 * - An empty selection: insert an empty block.
 * The cursor goes after the opening fence, so that the user can type the language.
 */
export const toggleCodeBlock: Edit = (state) => {
  const doc = state.doc;
  const main = state.selection.main;
  const mainLine = doc.lineAt(main.head).number;

  // Inside a fenced block, with no selection: take the fences away.
  if (main.empty) {
    const fence = findFences(docLines(doc)).find((f) => mainLine >= f.open && mainLine <= (f.close ?? doc.lines));
    if (fence) {
      const open = doc.line(fence.open);
      const changes: ChangeSpec[] = [{ from: open.from, to: Math.min(open.to + 1, doc.length) }];
      if (fence.close !== null) {
        const close = doc.line(fence.close);
        changes.push({ from: Math.max(close.from - 1, open.to + 1), to: close.to });
      }
      return changesSpec(state, changes);
    }
  }

  const numbers = selectedLineNumbers(state);
  const first = doc.line(numbers[0]!);
  const last = doc.line(numbers[numbers.length - 1]!);
  const hasText = !main.empty || !isBlank(first.text);
  const body = hasText ? doc.sliceString(first.from, last.to) : "";
  const fence = fenceFor(body);

  if (!hasText) {
    // An empty line: put the block on it.
    const insert = `${fence}\n\n${fence}`;
    return {
      changes: { from: first.from, to: first.to, insert },
      selection: EditorSelection.cursor(first.from + fence.length),
    };
  }
  return {
    changes: [
      { from: first.from, insert: `${fence}\n` },
      { from: last.to, insert: `\n${fence}` },
    ],
    selection: EditorSelection.cursor(first.from + fence.length),
  };
};

/**
 * Insert a horizontal rule (`---`) after the cursor line. A blank line goes before it, because
 * a line of dashes right under text would make that text a heading.
 */
export const insertRule: Edit = (state) => {
  const line = state.doc.lineAt(state.selection.main.head);
  if (isBlank(line.text)) {
    // This blank line stays as the separator when the line above has text.
    const above = line.number > 1 && !isBlank(state.doc.line(line.number - 1).text);
    const insert = above ? "\n---\n" : "---\n";
    return {
      changes: { from: line.from, to: line.to, insert },
      selection: EditorSelection.cursor(line.from + insert.length),
    };
  }
  const insert = "\n\n---\n";
  return {
    changes: { from: line.to, insert },
    selection: EditorSelection.cursor(line.to + insert.length),
  };
};
