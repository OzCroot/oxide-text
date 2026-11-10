// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { extensionForMime, htmlToMarkdown, linksForFiles, looksStructural } from "./paste";

describe("extensionForMime", () => {
  it("maps image types", () => {
    expect(extensionForMime("image/png")).toBe("png");
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/svg+xml")).toBeNull(); // not pasted as a file
    expect(extensionForMime("text/plain")).toBeNull();
  });
});

describe("looksStructural", () => {
  it("accepts headings, lists, tables, and links", () => {
    for (const h of ["<h2>T</h2>", "<ul><li>a</li></ul>", "<table><tr><td>a</td></tr></table>", '<a href="x">y</a>', "<strong>b</strong>", "<pre>x</pre>"]) {
      expect(looksStructural(h), h).toBe(true);
    }
  });
  it("rejects the styled spans of a code editor", () => {
    expect(looksStructural('<div style="color:#ccc"><span style="color:#f00">const</span> x</div>')).toBe(false);
  });
});

describe("htmlToMarkdown", () => {
  it("converts headings, emphasis, links, and lists", () => {
    const md = htmlToMarkdown('<h2>Title</h2><p>A <strong>bold</strong> and <em>soft</em> <a href="https://x.y">link</a>.</p><ul><li>one</li><li>two</li></ul>');
    expect(md).toBe("## Title\n\nA **bold** and *soft* [link](https://x.y).\n\n- one\n- two");
  });
  it("converts a table", () => {
    const md = htmlToMarkdown("<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>");
    expect(md).toContain("| a | b |");
    expect(md).toContain("| 1 | 2 |");
  });
  it("converts a code block and strikethrough", () => {
    const md = htmlToMarkdown("<pre><code>let a = 1;</code></pre><p><del>gone</del></p>");
    expect(md).toContain("```\nlet a = 1;\n```");
    expect(md).toContain("~~gone~~");
  });
  it("drops script and style", () => {
    expect(htmlToMarkdown("<style>p{}</style><script>alert(1)</script><p>hi</p>")).toBe("hi");
  });
});

describe("linksForFiles", () => {
  it("makes image and file links relative to the document", () => {
    expect(linksForFiles(["/d/n/img/a b.png", "/d/n/spec.pdf", "/d/other/x.md"], "/d/n")).toBe(
      "![a b](./img/a%20b.png)\n[spec.pdf](./spec.pdf)\n[x.md](../other/x.md)",
    );
  });
  it("escapes parentheses in a path", () => {
    expect(linksForFiles(["/d/n/a(1).png"], "/d/n")).toBe("![a(1)](./a%281%29.png)");
  });
});
