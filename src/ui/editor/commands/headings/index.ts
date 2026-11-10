import type { ChangeSpec, EditorState } from "@codemirror/state";
import { changesSpec, docLines, fenceMask, selectedLineNumbers, type Edit } from "../shared";

const ATX = /^ {0,3}(#{1,6})(?=[ \t]|$)[ \t]*/;
// Lines where a heading marker does not make sense: lists, quotes, tables, indented code.
const NOT_A_PARAGRAPH = /^(?: {0,3}>|[ \t]*(?:[-*+]|\d{1,9}[.)])(?:[ \t]|$)|[ \t]*\||(?: {4}|\t))/;

/** The heading level of a line: 1 to 6, or 0 if it is not an ATX heading. */
export function headingLevel(text: string): number {
  const m = ATX.exec(text);
  return m ? m[1]!.length : 0;
}

function lineChange(from: number, text: string, level: number): ChangeSpec | null {
  const m = ATX.exec(text);
  const oldLen = m ? m[0].length : /^ {0,3}/.exec(text)![0].length;
  const insert = level === 0 ? "" : "#".repeat(level) + " ";
  if (text.slice(0, oldLen) === insert) return null;
  return { from, to: from + oldLen, insert };
}

/** Change the heading level of every selected line with `pick(currentLevel)`. */
function editHeadings(state: EditorState, pick: (level: number) => number): ReturnType<Edit> {
  const mask = fenceMask(docLines(state.doc));
  const changes: ChangeSpec[] = [];
  for (const n of selectedLineNumbers(state)) {
    if (mask[n]) continue;
    const line = state.doc.line(n);
    const level = headingLevel(line.text);
    if (level === 0 && NOT_A_PARAGRAPH.test(line.text)) continue;
    const c = lineChange(line.from, line.text, pick(level));
    if (c) changes.push(c);
  }
  return changesSpec(state, changes);
}

/**
 * Set heading level 1 to 6. If the first selected line already has this level,
 * every selected line becomes a paragraph again.
 */
export function setHeading(level: number): Edit {
  return (state) => {
    const first = selectedLineNumbers(state)[0];
    const firstLevel = first ? headingLevel(state.doc.line(first).text) : 0;
    const target = firstLevel === level ? 0 : level;
    return editHeadings(state, () => target);
  };
}

export const clearHeading: Edit = (state) => editHeadings(state, () => 0);

/** Make a heading more important: H3 becomes H2. A paragraph becomes H6. H1 stays H1. */
export const headingUp: Edit = (state) => editHeadings(state, (l) => (l === 0 ? 6 : Math.max(1, l - 1)));

/** Make a heading less important: H3 becomes H4. H6 becomes a paragraph. A paragraph stays. */
export const headingDown: Edit = (state) => editHeadings(state, (l) => (l === 0 || l === 6 ? 0 : l + 1));
