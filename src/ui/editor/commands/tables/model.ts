import { arrayLines, fenceMask, isBlank, type LineSource } from "../shared";

export type Align = "none" | "left" | "center" | "right";

export interface Cell {
  /** The cell text without the spaces around it. */
  text: string;
  /** The range of the raw cell between its pipes. */
  from: number;
  to: number;
}

/** Split a table row into cells. An escaped pipe (`\|`) does not split. Leading and trailing pipes are optional. */
export function splitRow(line: string): { indent: string; cells: Cell[] } {
  const indent = /^[ \t]*/.exec(line)![0];
  const pipes: number[] = [];
  for (let i = indent.length; i < line.length; i++) {
    const c = line[i];
    if (c === "\\") i++;
    else if (c === "|") pipes.push(i);
  }
  const cells: Cell[] = [];
  const add = (from: number, to: number) => cells.push({ text: line.slice(from, to).trim(), from, to });
  let cursor = indent.length;
  let p = 0;
  if (pipes[0] === indent.length) {
    cursor = indent.length + 1;
    p = 1;
  }
  for (; p < pipes.length; p++) {
    add(cursor, pipes[p]!);
    cursor = pipes[p]! + 1;
  }
  if (line.slice(cursor).trim() !== "") add(cursor, line.length);
  return { indent, cells };
}

const DELIMITER_CELL = /^:?-+:?$/;

/** True if the line is a delimiter row: `| --- | :-: |`. */
export function isDelimiterRow(line: string): boolean {
  if (!line.includes("|")) return false;
  const { cells } = splitRow(line);
  return cells.length > 0 && cells.every((c) => DELIMITER_CELL.test(c.text));
}

function alignOf(cell: string): Align {
  const l = cell.startsWith(":");
  const r = cell.endsWith(":");
  return l && r ? "center" : l ? "left" : r ? "right" : "none";
}

export interface Table {
  indent: string;
  header: string[];
  align: Align[];
  body: string[][];
}

export interface LocatedTable {
  table: Table;
  /** The header line number. The delimiter row is the next line. */
  first: number;
  /** The last row line number. */
  last: number;
}

const hasPipe = (s: string) => s.includes("|");

/** Find the table in a run of lines that all hold a pipe. The run is lines `a` to `b`. */
function tableInRun(src: LineSource, a: number, b: number): LocatedTable | null {
  for (let d = a + 1; d <= b; d++) {
    const delim = src.get(d);
    if (!isDelimiterRow(delim)) continue;
    const header = splitRow(src.get(d - 1));
    const delimCells = splitRow(delim).cells;
    // GFM needs the same number of cells in the header and the delimiter row.
    if (header.cells.length !== delimCells.length) continue;
    const body: string[][] = [];
    for (let n = d + 1; n <= b; n++) body.push(splitRow(src.get(n)).cells.map((c) => c.text));
    const table: Table = {
      indent: header.indent,
      header: header.cells.map((c) => c.text),
      align: delimCells.map((c) => alignOf(c.text)),
      body,
    };
    return { table, first: d - 1, last: b };
  }
  return null;
}

/** The table that holds line `n`, or null. `mask` marks the lines of fenced code. */
export function findTableAt(src: LineSource, n: number, mask = fenceMask(src)): LocatedTable | null {
  const ok = (k: number) => !mask[k] && !isBlank(src.get(k)) && hasPipe(src.get(k));
  if (n < 1 || n > src.count || !ok(n)) return null;
  let a = n;
  while (a > 1 && ok(a - 1)) a--;
  let b = n;
  while (b < src.count && ok(b + 1)) b++;
  const t = tableInRun(src, a, b);
  return t && n >= t.first && n <= t.last ? t : null;
}

/** Every table in the document. */
export function findTables(src: LineSource): LocatedTable[] {
  const mask = fenceMask(src);
  const ok = (k: number) => !mask[k] && !isBlank(src.get(k)) && hasPipe(src.get(k));
  const out: LocatedTable[] = [];
  let n = 1;
  while (n <= src.count) {
    if (!ok(n)) {
      n++;
      continue;
    }
    let b = n;
    while (b < src.count && ok(b + 1)) b++;
    const t = tableInRun(src, n, b);
    if (t) out.push(t);
    n = b + 1;
  }
  return out;
}

/** The number of columns: the most cells in any row. */
export function columnCount(t: Table): number {
  return Math.max(t.header.length, t.align.length, ...t.body.map((r) => r.length), 1);
}

function pad(text: string, width: number, align: Align): string {
  const gap = width - text.length;
  if (gap <= 0) return text;
  if (align === "right") return " ".repeat(gap) + text;
  if (align === "center") {
    const left = Math.floor(gap / 2);
    return " ".repeat(left) + text + " ".repeat(gap - left);
  }
  return text + " ".repeat(gap);
}

function delimiterCell(width: number, align: Align): string {
  switch (align) {
    case "left":
      return ":" + "-".repeat(width - 1);
    case "right":
      return "-".repeat(width - 1) + ":";
    case "center":
      return ":" + "-".repeat(width - 2) + ":";
    default:
      return "-".repeat(width);
  }
}

/** The lines of a table with every column padded to the same width. Short rows get empty cells. */
export function formatTable(t: Table): string[] {
  const cols = columnCount(t);
  const header = Array.from({ length: cols }, (_, c) => t.header[c] ?? "");
  const align = Array.from({ length: cols }, (_, c) => t.align[c] ?? "none");
  const body = t.body.map((r) => Array.from({ length: cols }, (_, c) => r[c] ?? ""));
  // A column is at least 3 wide, so that the delimiter row has room for `:-:`.
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(3, header[c]!.length, ...body.map((r) => r[c]!.length)),
  );
  const row = (cells: string[]) =>
    t.indent + "| " + cells.map((cell, c) => pad(cell, widths[c]!, align[c]!)).join(" | ") + " |";
  const delim = t.indent + "| " + widths.map((w, c) => delimiterCell(w, align[c]!)).join(" | ") + " |";
  return [row(header), delim, ...body.map(row)];
}

/**
 * Pad every GFM table in a document. Text outside tables, and code blocks, do not change.
 * The line endings of the input stay.
 */
export function formatTablesInText(text: string): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const tables = findTables(arrayLines(lines));
  if (tables.length === 0) return text;
  const out: string[] = [];
  let n = 1;
  for (const t of tables) {
    while (n < t.first) out.push(lines[n++ - 1]!);
    out.push(...formatTable(t.table));
    n = t.last + 1;
  }
  while (n <= lines.length) out.push(lines[n++ - 1]!);
  return out.join(eol);
}

/** The index of the cell that holds `offset`. A cursor at a pipe belongs to the cell before it. */
export function cellIndexAt(line: string, offset: number): number {
  const { cells } = splitRow(line);
  if (cells.length === 0) return 0;
  for (let i = 0; i < cells.length; i++) if (offset <= cells[i]!.to) return i;
  return cells.length - 1;
}

/** The range of the text in cell `col` of a line, without the spaces around it. */
export function cellContentRange(line: string, col: number): { from: number; to: number } {
  const cells = splitRow(line).cells;
  const cell = cells[Math.min(col, cells.length - 1)];
  if (!cell) return { from: line.length, to: line.length };
  const raw = line.slice(cell.from, cell.to);
  const lead = raw.length - raw.trimStart().length;
  const text = raw.trim();
  // An empty cell: the cursor goes after the first space.
  if (text === "") return { from: cell.from + Math.min(1, raw.length), to: cell.from + Math.min(1, raw.length) };
  return { from: cell.from + lead, to: cell.from + lead + text.length };
}
