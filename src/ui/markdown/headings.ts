import { splitFrontMatter } from "./frontmatter";

import { uniqueSlugger } from "./slug";

export interface Heading {
  level: number;
  text: string;
  /** The line number in the document, from 1. */
  line: number;
}

/** Remove inline Markdown marks from a heading text, for the outline. */
function plain(text: string): string {
  return text
    .replace(/\s+#+\s*$/, "") // closing hashes
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

/**
 * The headings of a document, for the outline. It reads ATX ("# Title") and
 * setext ("Title" over "====") headings, and skips fenced code and front matter.
 */
export function extractHeadings(text: string): Heading[] {
  const fm = splitFrontMatter(text);
  const lines = fm.body.split("\n");
  const offset = fm.lines;
  const out: Heading[] = [];
  let fence: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = (lines[i] ?? "").replace(/\r$/, "");
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(raw);
    if (fence) {
      if (f && f[1]!.startsWith(fence[0]!) && f[1]!.length >= fence.length && /^ {0,3}[`~]+\s*$/.test(raw)) fence = null;
      continue;
    }
    if (f) {
      fence = f[1]!;
      continue;
    }
    const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/.exec(raw);
    if (atx) {
      const t = plain(atx[2] ?? "");
      if (t !== "" || (atx[2] ?? "") === "") out.push({ level: atx[1]!.length, text: t, line: offset + i + 1 });
      continue;
    }
    // Setext: a text line, then a line of "=" or "-".
    const next = (lines[i + 1] ?? "").replace(/\r$/, "");
    if (raw.trim() !== "" && !/^ {0,3}([-*+]|\d+[.)])\s/.test(raw) && !/^ {0,3}>/.test(raw)) {
      const s = /^ {0,3}(=+|-+)[ \t]*$/.exec(next);
      if (s && (i === 0 || (lines[i - 1] ?? "").trim() === "")) {
        out.push({ level: s[1]![0] === "=" ? 1 : 2, text: plain(raw), line: offset + i + 1 });
        i++;
      }
    }
  }
  return out;
}

/** The line of the heading that an anchor ("#my-part") points to, or null. */
export function anchorLine(text: string, id: string): number | null {
  const slug = uniqueSlugger();
  for (const h of extractHeadings(text)) if (slug(h.text) === id) return h.line;
  return null;
}
