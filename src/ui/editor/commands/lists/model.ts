import { indentWidth, isBlank, type LineSource } from "../shared";

export interface ListLine {
  /** Leading whitespace. */
  indent: string;
  /** The marker, such as `-`, `*`, `+`, `3.` or `3)`. */
  marker: string;
  ordered: boolean;
  /** The number of an ordered item. 0 for a bullet. */
  number: number;
  /** `.` or `)` for an ordered item. Empty for a bullet. */
  delim: string;
  /** The whitespace after the marker. */
  gap: string;
  /** The task checkbox: " " for open, "x" or "X" for done, null for none. */
  task: " " | "x" | "X" | null;
  /** The item text after the marker and the checkbox. */
  rest: string;
  /** The offset where the item text starts. */
  textFrom: number;
  /** The width in columns of the indent, the marker, and the gap. */
  contentCol: number;
}

const LIST = /^([ \t]*)((?:[-*+])|(?:(\d{1,9})([.)])))([ \t]+|$)(?:\[([ xX])\](?:[ \t]+|$))?(.*)$/;

/** Parse a list item line. Returns null if the line is not a list item. */
export function parseListLine(text: string): ListLine | null {
  const m = LIST.exec(text);
  if (!m) return null;
  const indent = m[1]!;
  const marker = m[2]!;
  const gap = m[5]!;
  const rest = m[7]!;
  return {
    indent,
    marker,
    ordered: m[3] !== undefined,
    number: m[3] !== undefined ? Number(m[3]) : 0,
    delim: m[4] ?? "",
    gap,
    task: (m[6] as " " | "x" | "X" | undefined) ?? null,
    rest,
    textFrom: text.length - rest.length,
    contentCol: indentWidth(indent) + marker.length + gap.length,
  };
}

const QUOTE = /^( {0,3}(?:>[ \t]?)+)(.*)$/;

/** Parse a blockquote line. `prefix` is the quote marks, and `rest` is the text after them. */
export function parseQuoteLine(text: string): { prefix: string; rest: string } | null {
  const m = QUOTE.exec(text);
  return m ? { prefix: m[1]!, rest: m[2]! } : null;
}

/**
 * The lines of the list around line `n`, with the blank lines inside it.
 * Returns null if line `n` is not in a list.
 */
export function listBlockAround(src: LineSource, n: number): [number, number] | null {
  const listish = (k: number): boolean => {
    const t = src.get(k);
    return parseListLine(t) !== null || /^[ \t]{2,}\S/.test(t);
  };
  if (!listish(n)) return null;
  let start = n;
  let end = n;
  for (;;) {
    let k = start - 1;
    while (k >= 1 && isBlank(src.get(k))) k--;
    if (k >= 1 && listish(k)) start = k;
    else break;
  }
  for (;;) {
    let k = end + 1;
    while (k <= src.count && isBlank(src.get(k))) k++;
    if (k <= src.count && listish(k)) end = k;
    else break;
  }
  return [start, end];
}
