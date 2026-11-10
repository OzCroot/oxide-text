export interface FrontMatter {
  /** The text between the "---" lines, or null if the document has none. */
  front: string | null;
  /** The document without the front matter. */
  body: string;
  /** The number of lines that the front matter takes, including the "---" lines. */
  lines: number;
}

/** Split YAML front matter off the start of a document. */
export function splitFrontMatter(text: string): FrontMatter {
  const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return { front: null, body: text, lines: 0 };
  const lines = m[0].split("\n").length - (m[0].endsWith("\n") ? 1 : 0);
  return { front: m[1] ?? "", body: text.slice(m[0].length), lines };
}
