import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { extensionOf, relativePath, stemOf, baseName } from "@/markdown/paths";

// Pasting and dropping: an image becomes a file and a link, HTML becomes Markdown,
// and a dropped file becomes a link.

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"]);

export function isImageName(name: string): boolean {
  return IMAGE_EXT.has(extensionOf(name));
}

/** The file extension for an image MIME type, or null. */
export function extensionForMime(mime: string): string | null {
  const m = /^image\/(png|jpeg|gif|webp|bmp|avif)$/i.exec(mime);
  if (!m) return null;
  return m[1]!.toLowerCase() === "jpeg" ? "jpg" : m[1]!.toLowerCase();
}

/**
 * True if pasted HTML has structure that Markdown can keep: headings, lists, tables,
 * links, emphasis, quotes, images, or code blocks. HTML from a code editor is only
 * styled spans and divs. Converting it would lose the layout of the text, so we skip it.
 */
export function looksStructural(html: string): boolean {
  return /<(h[1-6]|ul|ol|li|table|a\s|strong|em|b>|i>|blockquote|img|pre|del|s>)/i.test(html);
}

let turndown: TurndownService | null = null;

export function htmlToMarkdown(html: string): string {
  turndown ??= (() => {
    const t = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
    t.use(gfm);
    // markdown-it, and so our preview, needs two tildes for strikethrough.
    t.addRule("strikethrough", {
      filter: ["del", "s"],
      replacement: (content) => `~~${content}~~`,
    });
    // One space after the bullet, as people write it. Turndown pads it to four columns.
    t.addRule("listItem", {
      filter: "li",
      replacement: (content, node, options) => {
        const text = content.replace(/^\n+/, "").replace(/\n+$/, "\n").replace(/\n/gm, "\n  ");
        const parent = node.parentNode as HTMLElement | null;
        let prefix = `${options.bulletListMarker} `;
        if (parent && parent.nodeName === "OL") {
          const start = parent.getAttribute("start");
          const index = Array.prototype.indexOf.call(parent.children, node);
          prefix = `${(start ? Number(start) : 1) + index}. `;
        }
        return prefix + text + (node.nextSibling && !/\n$/.test(text) ? "\n" : "");
      },
    });
    // Script and style content is not text.
    t.remove(["script", "style", "meta", "title"]);
    return t;
  })();
  return turndown.turndown(html).trim();
}

/** The Markdown for dropped files: `![name](rel)` for an image, `[name](rel)` for the rest. */
export function linksForFiles(paths: string[], baseDir: string): string {
  return paths
    .map((p) => {
      const rel = encodeURI(relativePath(baseDir, p)).replace(/[()]/g, (c) => (c === "(" ? "%28" : "%29"));
      const label = isImageName(p) ? stemOf(p) : baseName(p);
      return `${isImageName(p) ? "!" : ""}[${label}](${rel})`;
    })
    .join("\n");
}

/** Replace the selections with `text`, and put the cursor after it. */
export function insertAtSelection(view: EditorView, text: string): void {
  view.dispatch(
    view.state.update(
      view.state.changeByRange((r) => ({
        changes: { from: r.from, to: r.to, insert: text },
        range: EditorSelection.cursor(r.from + text.length),
      })),
      { scrollIntoView: true, userEvent: "input.paste" },
    ),
  );
}
