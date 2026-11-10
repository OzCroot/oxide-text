import MarkdownIt, { type StateCore, type Token } from "markdown-it";

type Md = ReturnType<typeof MarkdownIt>;
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import { splitFrontMatter } from "./frontmatter";
import { uniqueSlugger } from "./slug";

/** The text of an inline token, without marks, for a heading id. */
function inlineText(token: Token): string {
  if (!token.children) return token.content;
  return token.children
    .filter((c) => c.type === "text" || c.type === "code_inline")
    .map((c) => c.content)
    .join("");
}

/**
 * Two rules on top of markdown-it:
 * - `data-line` on each block, with its source line. The preview uses it for scroll sync.
 * - `id` on each heading, for anchor links.
 */
function sourceLines(md: Md): void {
  md.core.ruler.push("oxide_source_lines", (state: StateCore) => {
    const offset = (state.env as { lineOffset?: number }).lineOffset ?? 0;
    const slug = uniqueSlugger();
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]!;
      if (t.map && t.nesting !== -1 && t.type !== "inline") {
        t.attrSet("data-line", String(t.map[0] + 1 + offset));
      }
      if (t.type === "heading_open") {
        const inline = tokens[i + 1];
        if (inline && inline.type === "inline") t.attrSet("id", slug(inlineText(inline)));
      }
    }
  });
}

function createRenderer(): Md {
  // `html: true` lets Markdown carry HTML such as <details>. The sanitizer cleans it.
  // Do not use this output without `sanitizeHtml`.
  const md = new MarkdownIt({ html: true, linkify: true, typographer: false });
  md.use(footnote);
  md.use(taskLists, { enabled: false, label: true });
  md.use(sourceLines);
  return md;
}

const md = createRenderer();

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Turn Markdown into HTML. The output is NOT safe. Pass it to `sanitizeHtml`.
 * YAML front matter shows as a collapsible card.
 */
export function renderMarkdown(text: string): string {
  const fm = splitFrontMatter(text);
  const body = md.render(fm.body, { lineOffset: fm.lines });
  if (fm.front === null) return body;
  return `<details class="md-front-matter" data-line="1"><summary>Front matter</summary><pre>${escapeHtml(fm.front)}</pre></details>${body}`;
}
