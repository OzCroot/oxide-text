import { describe, expect, it } from "vitest";
import { EditorState, type Extension } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { canParseMarkdown, longestBlockLines, MAX_BLOCK_LINES } from "./large";

describe("longestBlockLines", () => {
  it("counts the longest run of non-blank lines", () => {
    expect(longestBlockLines("a\nb\nc\n\nd\n")).toBe(3);
  });
  it("treats a line of spaces as blank", () => {
    expect(longestBlockLines("a\n  \t\nb\n")).toBe(1);
  });
  it("handles CRLF and no final newline", () => {
    expect(longestBlockLines("a\r\nb\r\n\r\nc")).toBe(2);
  });
  it("is 0 for empty text", () => {
    expect(longestBlockLines("")).toBe(0);
  });
});

// M0 exit criterion: the editor opens and edits a 10 MB file.
// These tests cover the editor state and the text. They do not render.
describe("10 MB document", () => {
  const MB10 = 10 * 1024 * 1024;

  const edit = (text: string, extensions: Extension) => {
    const t0 = performance.now();
    let state = EditorState.create({ doc: text, extensions });
    expect(state.doc.length).toBe(text.length);
    const mid = Math.floor(state.doc.length / 2);
    state = state.update({ changes: { from: mid, insert: "EDIT" } }).state;
    const out = state.doc.toString();
    expect(out.length).toBe(text.length + 4);
    expect(out.slice(mid, mid + 4)).toBe("EDIT");
    return performance.now() - t0;
  };

  it("opens and edits normal Markdown, with the Markdown parser on", () => {
    const para = "The quick brown fox jumps over the lazy dog. **bold** [link](./a.md)\n\n";
    const text = para.repeat(Math.ceil(MB10 / para.length));
    expect(canParseMarkdown(text)).toBe(true);
    expect(edit(text, [markdown({ base: markdownLanguage })])).toBeLessThan(5000);
  });

  it("opens and edits one huge block as plain text", () => {
    const line = "The quick brown fox jumps over the lazy dog. **bold** [link](./a.md)\n";
    const text = line.repeat(Math.ceil(MB10 / line.length));
    expect(longestBlockLines(text)).toBeGreaterThan(MAX_BLOCK_LINES);
    expect(canParseMarkdown(text)).toBe(false);
    expect(edit(text, [])).toBeLessThan(5000);
  });
});
