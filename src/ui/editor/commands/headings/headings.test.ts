import { describe, expect, it } from "vitest";
import { clearHeading, headingDown, headingLevel, headingUp, setHeading } from "./index";
import { runEdit } from "../testing";

describe("headingLevel", () => {
  it.each([
    ["# a", 1],
    ["###### a", 6],
    ["####### a", 0],
    ["#tag", 0],
    ["  ## a", 2],
    ["    # code", 0],
    ["#", 1],
    ["text", 0],
  ])("%j is level %i", (text, level) => expect(headingLevel(text)).toBe(level));
});

describe("setHeading", () => {
  it("adds a heading to a paragraph", () => expect(runEdit("¦text", setHeading(2))).toBe("## ¦text"));
  it("changes the level", () => expect(runEdit("# ¦Title", setHeading(3))).toBe("### ¦Title"));
  it("toggles back to a paragraph when the level is the same", () => expect(runEdit("## ¦a", setHeading(2))).toBe("¦a"));
  it("works on an empty line", () => expect(runEdit("¦", setHeading(1))).toBe("# ¦"));
  it("works on every selected line", () => expect(runEdit("⟦one\ntwo⟧", setHeading(1))).toBe("# ⟦one\n# two⟧"));
  it("decides by the first line when levels differ", () => {
    expect(runEdit("⟦# one\ntwo⟧", setHeading(1))).toBe("⟦one\ntwo⟧");
  });
  it("treats #tag as text", () => expect(runEdit("¦#tag", setHeading(1))).toBe("# ¦#tag"));
  it("leaves list items alone", () => expect(runEdit("- ¦item", setHeading(1))).toBe("- ¦item"));
  it("leaves quotes alone", () => expect(runEdit("> ¦quote", setHeading(1))).toBe("> ¦quote"));
  it("leaves table rows alone", () => expect(runEdit("| ¦a |", setHeading(1))).toBe("| ¦a |"));
  it("leaves a line in a code block alone", () => {
    expect(runEdit("```\n# ¦x\n```", setHeading(2))).toBe("```\n# ¦x\n```");
  });
  it("removes extra spaces before the marker", () => expect(runEdit("  ¦a", setHeading(1))).toBe("# ¦a"));
});

describe("clearHeading", () => {
  it("makes a heading a paragraph", () => expect(runEdit("## ¦a", clearHeading)).toBe("¦a"));
  it("does nothing to a paragraph", () => expect(runEdit("¦a", clearHeading)).toBe("¦a"));
});

describe("headingUp and headingDown", () => {
  it("up: H3 becomes H2", () => expect(runEdit("### ¦a", headingUp)).toBe("## ¦a"));
  it("up: H1 stays", () => expect(runEdit("# ¦a", headingUp)).toBe("# ¦a"));
  it("up: a paragraph becomes H6", () => expect(runEdit("¦a", headingUp)).toBe("###### ¦a"));
  it("down: H3 becomes H4", () => expect(runEdit("### ¦a", headingDown)).toBe("#### ¦a"));
  it("down: H6 becomes a paragraph", () => expect(runEdit("###### ¦a", headingDown)).toBe("¦a"));
  it("down: a paragraph stays", () => expect(runEdit("¦a", headingDown)).toBe("¦a"));
  it("moves each selected line on its own", () => {
    expect(runEdit("⟦# a\n### b⟧", headingDown)).toBe("⟦## a\n#### b⟧");
  });
});
