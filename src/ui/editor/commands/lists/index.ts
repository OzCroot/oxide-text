import type { ChangeSpec, EditorState } from "@codemirror/state";
import { EditorSelection } from "@codemirror/state";
import { changesSpec, indentWidth, isBlank, selectedLineNumbers, type Edit } from "../shared";
import { parseListLine } from "./model";

export { renumberList, renumberChanges } from "./renumber";
export { listEnter } from "./enter";
export { listIndent, listOutdent } from "./indent";
export { parseListLine, parseQuoteLine, listBlockAround } from "./model";

interface Target {
  n: number;
  from: number;
  text: string;
}

/** The lines to change: the non-blank selected lines. If there are none, the cursor line. */
function targets(state: EditorState): { lines: Target[]; onlyBlank: boolean } {
  const all = selectedLineNumbers(state).map((n) => {
    const l = state.doc.line(n);
    return { n, from: l.from, text: l.text };
  });
  const nonBlank = all.filter((l) => !isBlank(l.text));
  return nonBlank.length ? { lines: nonBlank, onlyBlank: false } : { lines: all.slice(0, 1), onlyBlank: true };
}

/** An insert on a blank line, with the cursor after the inserted text. */
function blankLineInsert(t: Target, insert: string): ReturnType<Edit> {
  const at = t.from + t.text.length;
  return {
    changes: { from: at, insert },
    selection: EditorSelection.cursor(at + insert.length),
  };
}

/** Remove the marker, the checkbox, and the indent of a list line. */
function removePrefix(t: Target): ChangeSpec | null {
  const item = parseListLine(t.text);
  return item ? { from: t.from, to: t.from + item.textFrom } : null;
}

/** Toggle a bullet list on the selected lines. Numbered items become bullets. */
export const toggleBullet: Edit = (state) => {
  const { lines, onlyBlank } = targets(state);
  const items = lines.map((t) => parseListLine(t.text));
  if (!onlyBlank && items.every((i) => i && !i.ordered)) {
    return changesSpec(state, lines.flatMap((t) => removePrefix(t) ?? []));
  }
  if (onlyBlank) return blankLineInsert(lines[0]!, "- ");
  const changes: ChangeSpec[] = [];
  lines.forEach((t, k) => {
    const item = items[k];
    if (item) {
      if (item.marker !== "-") {
        const from = t.from + item.indent.length;
        changes.push({ from, to: from + item.marker.length, insert: "-" });
      }
    } else {
      changes.push({ from: t.from + /^[ \t]*/.exec(t.text)![0].length, insert: "- " });
    }
  });
  return changesSpec(state, changes);
};

/** Toggle a numbered list on the selected lines. Each nesting level counts from 1. */
export const toggleNumbered: Edit = (state) => {
  const { lines, onlyBlank } = targets(state);
  const items = lines.map((t) => parseListLine(t.text));
  if (!onlyBlank && items.every((i) => i && i.ordered)) {
    return changesSpec(state, lines.flatMap((t) => removePrefix(t) ?? []));
  }
  if (onlyBlank) return blankLineInsert(lines[0]!, "1. ");
  const counters = new Map<number, number>();
  const changes: ChangeSpec[] = [];
  lines.forEach((t, k) => {
    const item = items[k];
    const indent = item ? item.indent : /^[ \t]*/.exec(t.text)![0];
    const w = indentWidth(indent);
    for (const key of [...counters.keys()]) if (key > w) counters.delete(key);
    const num = counters.get(w) ?? 1;
    counters.set(w, num + 1);
    const from = t.from + indent.length;
    if (item) {
      changes.push({ from, to: from + item.marker.length, insert: `${num}${item.ordered ? item.delim : "."}` });
    } else {
      changes.push({ from, insert: `${num}. ` });
    }
  });
  return changesSpec(state, changes);
};

/** Toggle a task list on the selected lines. If every line is a task, the lines become paragraphs. */
export const toggleTaskList: Edit = (state) => {
  const { lines, onlyBlank } = targets(state);
  const items = lines.map((t) => parseListLine(t.text));
  if (!onlyBlank && items.every((i) => i && i.task !== null)) {
    return changesSpec(state, lines.flatMap((t) => removePrefix(t) ?? []));
  }
  if (onlyBlank) return blankLineInsert(lines[0]!, "- [ ] ");
  const changes: ChangeSpec[] = [];
  lines.forEach((t, k) => {
    const item = items[k];
    if (!item) {
      changes.push({ from: t.from + /^[ \t]*/.exec(t.text)![0].length, insert: "- [ ] " });
    } else if (item.task === null) {
      // A marker with no gap, such as "-", needs a space before the checkbox.
      changes.push({ from: t.from + item.textFrom, insert: item.gap === "" ? " [ ] " : "[ ] " });
    }
  });
  return changesSpec(state, changes);
};

/**
 * Toggle the task checkbox on the cursor line of each selection.
 * A list item with no checkbox gets one. A line that is not a list item is skipped.
 */
export const toggleTask: Edit = (state) => {
  const lineNumbers = new Set<number>();
  for (const r of state.selection.ranges) lineNumbers.add(state.doc.lineAt(r.head).number);
  const changes: ChangeSpec[] = [];
  for (const n of lineNumbers) {
    const line = state.doc.line(n);
    const item = parseListLine(line.text);
    if (!item) continue;
    if (item.task === null) {
      changes.push({ from: line.from + item.textFrom, insert: item.gap === "" ? " [ ] " : "[ ] " });
    } else {
      // The checkbox is `[` + the character + `]`. This is the character.
      const boxChar = line.from + item.indent.length + item.marker.length + item.gap.length + 1;
      changes.push({ from: boxChar, to: boxChar + 1, insert: item.task === " " ? "x" : " " });
    }
  }
  return changesSpec(state, changes);
};
