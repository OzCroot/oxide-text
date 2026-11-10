import { describe, expect, it } from "vitest";
import { anchorLine, extractHeadings } from "./headings";
import { splitFrontMatter } from "./frontmatter";

describe("extractHeadings", () => {
  it("reads ATX headings with their line numbers", () => {
    expect(extractHeadings("# One\n\ntext\n\n## Two ##\n")).toEqual([
      { level: 1, text: "One", line: 1 },
      { level: 2, text: "Two", line: 5 },
    ]);
  });
  it("reads setext headings", () => {
    expect(extractHeadings("Title\n=====\n\nSub\n---\n")).toEqual([
      { level: 1, text: "Title", line: 1 },
      { level: 2, text: "Sub", line: 4 },
    ]);
  });
  it("skips fenced code", () => {
    expect(extractHeadings("```sh\n# not a heading\n```\n# Real\n")).toEqual([{ level: 1, text: "Real", line: 4 }]);
  });
  it("skips a longer fence that contains a shorter one", () => {
    expect(extractHeadings("````\n```\n# no\n```\n````\n# yes\n").map((h) => h.text)).toEqual(["yes"]);
  });
  it("counts lines after front matter", () => {
    expect(extractHeadings("---\ntitle: x\n---\n# Doc\n")).toEqual([{ level: 1, text: "Doc", line: 4 }]);
  });
  it("removes inline marks", () => {
    expect(extractHeadings("# A **bold** [link](x) `code`\n")[0]!.text).toBe("A bold link code");
  });
  it("does not take a list item or a rule as a heading", () => {
    expect(extractHeadings("- item\n---\n\ntext\n\n---\n")).toEqual([]);
  });
  it("does not need a space after # for nothing: #tag is not a heading", () => {
    expect(extractHeadings("#tag\n")).toEqual([]);
  });
  it("handles CRLF", () => {
    expect(extractHeadings("# A\r\n\r\n## B\r\n").map((h) => h.text)).toEqual(["A", "B"]);
  });
});

describe("splitFrontMatter", () => {
  it("splits it off", () => {
    expect(splitFrontMatter("---\na: 1\n---\nbody\n")).toEqual({ front: "a: 1", body: "body\n", lines: 3 });
  });
  it("needs the --- on the first line", () => {
    expect(splitFrontMatter("\n---\na: 1\n---\n").front).toBeNull();
  });
  it("is null when never closed", () => {
    expect(splitFrontMatter("---\na: 1\nbody").front).toBeNull();
  });
});

describe("anchorLine", () => {
  it("finds the line of a heading id", () => {
    expect(anchorLine("# A\n\n## Hello World\n", "hello-world")).toBe(3);
  });
  it("follows the numbering of repeated headings", () => {
    expect(anchorLine("# A\n\n# A\n", "a-1")).toBe(3);
  });
  it("is null when nothing matches", () => {
    expect(anchorLine("# A\n", "b")).toBeNull();
  });
});
