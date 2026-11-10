import { describe, expect, it } from "vitest";
import { lineAtTop, topAtLine, type Anchor } from "./scroll-sync";

const anchors: Anchor[] = [
  { line: 1, top: 0 },
  { line: 11, top: 100 },
  { line: 21, top: 400 },
];

describe("scroll sync", () => {
  it("finds the line at a position", () => {
    expect(lineAtTop(anchors, 0)).toBe(1);
    expect(lineAtTop(anchors, 50)).toBe(6);
    expect(lineAtTop(anchors, 250)).toBe(16);
    expect(lineAtTop(anchors, 9999)).toBe(21);
    expect(lineAtTop(anchors, -5)).toBe(1);
  });
  it("finds the position of a line", () => {
    expect(topAtLine(anchors, 1)).toBe(0);
    expect(topAtLine(anchors, 6)).toBe(50);
    expect(topAtLine(anchors, 16)).toBe(250);
    expect(topAtLine(anchors, 99)).toBe(400);
  });
  it("is the inverse in both directions", () => {
    for (const line of [1, 3, 8, 11, 15, 20]) expect(lineAtTop(anchors, topAtLine(anchors, line))).toBeCloseTo(line);
  });
  it("copes with no anchors", () => {
    expect(lineAtTop([], 10)).toBe(1);
    expect(topAtLine([], 10)).toBe(0);
  });
});
