// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./render";
import { sanitizeHtml, type SanitizeOptions } from "./sanitize";

const opts = (o: Partial<SanitizeOptions> = {}): SanitizeOptions => ({
  baseDir: "/docs/notes",
  remoteImages: false,
  toAssetUrl: (p) => `asset://local${p}`,
  ...o,
});

const clean = (html: string, o?: Partial<SanitizeOptions>) => sanitizeHtml(html, opts(o));
const md = (text: string, o?: Partial<SanitizeOptions>) => clean(renderMarkdown(text), o);

describe("script and event handlers", () => {
  it("removes script tags", () => {
    expect(clean("<p>a</p><script>alert(1)</script>")).toBe("<p>a</p>");
  });
  it("removes event handler attributes", () => {
    const out = clean('<img src="x" onerror="alert(1)"><a href="#a" onclick="x()">t</a>');
    expect(out).not.toMatch(/onerror|onclick/i);
  });
  it("removes javascript: links in every spelling", () => {
    for (const href of ["javascript:alert(1)", " javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\tscript:alert(1)", "&#106;avascript:alert(1)", "vbscript:x", "data:text/html,<script>alert(1)</script>"]) {
      const out = clean(`<a href="${href}">x</a>`);
      expect(out, href).not.toMatch(/javascript|vbscript|data:text/i);
    }
  });
  it("removes javascript: links written in Markdown", () => {
    // markdown-it refuses to make a link, and the text stays as text.
    expect(md("[x](javascript:alert(1))")).not.toMatch(/<a |href/i);
  });
  it("resists a mutation XSS payload", () => {
    const out = clean("<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>");
    expect(out).not.toMatch(/onerror|<style|<math/i);
  });
  it("removes script inside raw HTML in Markdown", () => {
    expect(md("hello\n\n<script>alert(1)</script>\n")).not.toMatch(/<script/i);
  });
});

describe("tags that load or submit", () => {
  it("removes iframes, objects, embeds, and forms", () => {
    for (const tag of [
      '<iframe src="https://x.y"></iframe>',
      '<object data="x"></object>',
      '<embed src="x">',
      '<form action="https://x.y"><button>go</button></form>',
      "<video src=x></video>",
      "<audio src=x></audio>",
    ]) {
      expect(clean(`<p>a</p>${tag}`), tag).not.toMatch(/<(iframe|object|embed|form|button|video|audio)/i);
    }
  });
  it("removes style tags and style attributes", () => {
    const out = clean('<style>body{background:url(http://x.y/a)}</style><p style="background:url(http://x.y/a)">t</p>');
    expect(out).toBe("<p>t</p>");
  });
  it("removes link, meta, and base tags", () => {
    const out = clean('<link rel="stylesheet" href="http://x.y/a.css"><meta http-equiv="refresh" content="0;url=http://x.y"><base href="http://x.y/">');
    expect(out).toBe("");
  });
  it("removes inline svg", () => {
    expect(clean('<svg onload="alert(1)"><image href="http://x.y/a.png"/></svg>')).toBe("");
  });
  it("removes srcset and picture sources", () => {
    const out = clean('<picture><source srcset="http://x.y/a.png"><img src="a.png" srcset="http://x.y/b.png 2x"></picture>');
    expect(out).not.toMatch(/srcset|<source|<picture|x\.y/i);
  });
  it("keeps only checkboxes of the input tag, and disables them", () => {
    const out = clean('<input type="text" value="x"><input type="checkbox" checked>');
    expect(out).not.toMatch(/type="text"/);
    expect(out).toMatch(/type="checkbox"/);
    expect(out).toMatch(/disabled/);
  });
});

describe("images", () => {
  it("blocks remote images by default", () => {
    const out = md("![alt](https://tracker.example/p.png)");
    expect(out).not.toMatch(/tracker\.example/);
    expect(out).toMatch(/md-blocked-image/);
  });
  it("blocks protocol-relative images", () => {
    expect(clean('<img src="//tracker.example/p.png">')).not.toMatch(/tracker\.example/);
  });
  it("blocks a remote image written as raw HTML", () => {
    expect(md('<img src="http://tracker.example/p.png">')).not.toMatch(/tracker\.example/);
  });
  it("allows remote images when the setting is on", () => {
    expect(md("![a](https://img.example/p.png)", { remoteImages: true })).toMatch(/src="https:\/\/img\.example\/p\.png"/);
  });
  it("points a relative image at the document folder", () => {
    expect(md("![a](./assets/p.png)")).toMatch(/src="asset:\/\/local\/docs\/notes\/assets\/p\.png"/);
    expect(md("![a](../p%20q.png)")).toMatch(/src="asset:\/\/local\/docs\/p q\.png"/);
  });
  it("keeps an absolute path as the path, to be served by the scoped asset protocol", () => {
    expect(md("![a](/home/u/p.png)")).toMatch(/src="asset:\/\/local\/home\/u\/p\.png"/);
  });
  it("drops a relative image in an unsaved document", () => {
    const out = md("![a](./p.png)", { baseDir: null });
    expect(out).not.toMatch(/src=/);
  });
  it("keeps a data: image", () => {
    expect(clean('<img src="data:image/png;base64,AAAA">')).toMatch(/data:image\/png/);
  });
  it("does not allow a data: html document as an image", () => {
    expect(clean('<img src="data:text/html;base64,PHNjcmlwdD4=">')).not.toMatch(/data:text\/html/);
  });
  it("does not allow SVG as a data: image", () => {
    expect(clean('<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">')).not.toMatch(/data:/);
  });
  it("blocks file: URLs", () => {
    expect(clean('<img src="file:///etc/passwd">')).not.toMatch(/file:/);
  });
});

describe("links", () => {
  it("sets rel and removes target", () => {
    const out = clean('<a href="https://x.y" target="_blank">t</a>');
    expect(out).toMatch(/rel="noopener noreferrer"/);
    expect(out).not.toMatch(/target/);
  });
  it("keeps relative and anchor links", () => {
    const out = md("[a](./a.md) [b](#intro)");
    expect(out).toMatch(/href="\.\/a\.md"/);
    expect(out).toMatch(/href="#intro"/);
  });
});

describe("what must survive", () => {
  it("keeps data-line and heading ids", () => {
    const out = md("# Hello World\n\ntext\n");
    expect(out).toMatch(/<h1 data-line="1" id="hello-world">/);
    expect(out).toMatch(/<p data-line="3">/);
  });
  it("renders tables, task lists, strikethrough, and footnotes", () => {
    const out = md("| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\n~~gone~~\n\nnote[^1]\n\n[^1]: the note\n");
    expect(out).toMatch(/<table/);
    expect(out).toMatch(/task-list-item/);
    expect(out).toMatch(/<s>gone<\/s>/);
    expect(out).toMatch(/footnote/);
  });
  it("shows front matter as a card with escaped text", () => {
    const out = md("---\ntitle: <b>x</b>\n---\n# Doc\n");
    expect(out).toMatch(/md-front-matter/);
    expect(out).toMatch(/&lt;b&gt;x&lt;\/b&gt;/);
    // The heading line counts the front matter lines.
    expect(out).toMatch(/<h1 data-line="4"/);
  });
  it("keeps safe raw HTML such as details", () => {
    expect(md("<details><summary>s</summary>body</details>")).toMatch(/<details/);
  });
  it("numbers repeated headings", () => {
    const out = md("# A\n\n# A\n");
    expect(out).toMatch(/id="a"/);
    expect(out).toMatch(/id="a-1"/);
  });
});
