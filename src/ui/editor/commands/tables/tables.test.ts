import { describe, expect, it } from "vitest";
import { arrayLines } from "../shared";
import { runEdit } from "../testing";
import {
  addColumnLeft,
  addColumnRight,
  addRowAbove,
  addRowBelow,
  alignCenter,
  alignLeft,
  alignRight,
  deleteColumn,
  deleteRow,
  findTableAt,
  formatTableAtCursor,
  formatTablesInSelection,
  formatTablesInText,
  insertTable,
  isDelimiterRow,
  splitRow,
  tableNextCell,
  tablePreviousCell,
} from "./index";

const lines = (...l: string[]) => l.join("\n");

describe("splitRow", () => {
  it("splits a row with pipes at both ends", () => {
    expect(splitRow("| a | b |").cells.map((c) => c.text)).toEqual(["a", "b"]);
  });
  it("splits a row without leading or trailing pipes", () => {
    expect(splitRow("a | b").cells.map((c) => c.text)).toEqual(["a", "b"]);
  });
  it("keeps empty cells", () => {
    expect(splitRow("| a |  | c |").cells.map((c) => c.text)).toEqual(["a", "", "c"]);
  });
  it("does not split at an escaped pipe", () => {
    expect(splitRow("| a \\| b | c |").cells.map((c) => c.text)).toEqual(["a \\| b", "c"]);
  });
  it("keeps the indent", () => expect(splitRow("  | a |").indent).toBe("  "));
  it("gives the range of each cell between its pipes", () => {
    const cells = splitRow("| a | bb |").cells;
    expect(cells.map((c) => [c.from, c.to])).toEqual([
      [1, 4],
      [5, 9],
    ]);
  });
});

describe("isDelimiterRow", () => {
  it.each(["|---|---|", "| :-- | --: | :-: |", "--|--", "|-|"])("accepts %s", (t) => expect(isDelimiterRow(t)).toBe(true));
  it.each(["", "---", "| a | b |", "|--- x|", "| : |"])("rejects %j", (t) => expect(isDelimiterRow(t)).toBe(false));
});

describe("findTableAt", () => {
  it("finds a table from any of its lines", () => {
    const src = arrayLines(["text", "", "| a |", "| - |", "| 1 |", "", "after"]);
    for (const n of [3, 4, 5]) expect(findTableAt(src, n)).toMatchObject({ first: 3, last: 5 });
    expect(findTableAt(src, 1)).toBeNull();
    expect(findTableAt(src, 7)).toBeNull();
  });
  it("needs a delimiter row that matches the header", () => {
    expect(findTableAt(arrayLines(["| a | b |", "| - |", "| 1 | 2 |"]), 1)).toBeNull();
  });
  it("ignores a table in a code block", () => {
    expect(findTableAt(arrayLines(["```", "| a |", "| - |", "```"]), 2)).toBeNull();
  });
});

describe("formatTablesInText", () => {
  it("pads the columns and keeps the alignment", () => {
    const input = lines("| a | b |", "|---|:-:|", "| long cell | x |");
    expect(formatTablesInText(input)).toBe(
      lines("| a         |  b  |", "| --------- | :-: |", "| long cell |  x  |"),
    );
  });
  it("aligns text to the right in a right column", () => {
    const input = lines("| n |", "|--:|", "| 1000 |", "| 7 |");
    expect(formatTablesInText(input)).toBe(lines("|    n |", "| ---: |", "| 1000 |", "|    7 |"));
  });
  it("aligns text in a left column and gives the delimiter its colon", () => {
    expect(formatTablesInText(lines("| name |", "|:-|", "| ab |"))).toBe(lines("| name |", "| :--- |", "| ab   |"));
  });
  it("pads a short row with empty cells", () => {
    expect(formatTablesInText(lines("| a | b |", "|---|---|", "| 1 |"))).toBe(
      lines("| a   | b   |", "| --- | --- |", "| 1   |     |"),
    );
  });
  it("adds a column when a row has more cells than the header", () => {
    expect(formatTablesInText(lines("| a |", "|---|", "| 1 | 2 |"))).toBe(
      lines("| a   |     |", "| --- | --- |", "| 1   | 2   |"),
    );
  });
  it("reads a table with no outer pipes, and writes the outer pipes", () => {
    expect(formatTablesInText(lines("a | b", "--|--", "1 | 2"))).toBe(
      lines("| a   | b   |", "| --- | --- |", "| 1   | 2   |"),
    );
  });
  it("keeps an escaped pipe in a cell", () => {
    expect(formatTablesInText(lines("| a |", "|---|", "| x \\| y |"))).toBe(
      lines("| a      |", "| ------ |", "| x \\| y |"),
    );
  });
  it("keeps the indent of the table", () => {
    expect(formatTablesInText(lines("  | a |", "  |-|"))).toBe(lines("  | a   |", "  | --- |"));
  });
  it("does not touch text outside tables", () => {
    const input = lines("# Title", "", "a | b is not a table", "", "| a |", "|-|", "", "end");
    expect(formatTablesInText(input)).toBe(lines("# Title", "", "a | b is not a table", "", "| a   |", "| --- |", "", "end"));
  });
  it("does not touch a table in a code block", () => {
    const input = lines("```", "|a|", "|-|", "```");
    expect(formatTablesInText(input)).toBe(input);
  });
  it("formats several tables", () => {
    const input = lines("|a|", "|-|", "", "|b|", "|-|");
    expect(formatTablesInText(input)).toBe(lines("| a   |", "| --- |", "", "| b   |", "| --- |"));
  });
  it("keeps CRLF line endings", () => {
    expect(formatTablesInText("|a|\r\n|-|\r\n")).toBe("| a   |\r\n| --- |\r\n");
  });
  it("is the same when run twice", () => {
    const once = formatTablesInText(lines("| a | b |", "|---|:-:|", "| long cell | x |"));
    expect(formatTablesInText(once)).toBe(once);
  });
  it("returns the same text when there is no table", () => {
    expect(formatTablesInText("a\nb | c\n")).toBe("a\nb | c\n");
  });
});

describe("insertTable", () => {
  const TABLE = lines(
    "| Column 1 | Column 2 | Column 3 |",
    "| -------- | -------- | -------- |",
    "|          |          |          |",
    "|          |          |          |",
  );
  it("inserts a table and selects the first header", () => {
    expect(runEdit("¦", insertTable())).toBe(TABLE.replace("| Column 1 |", "| ⟦Column 1⟧ |"));
  });
  it("leaves a blank line after a line of text", () => {
    expect(runEdit("text¦", insertTable())).toBe("text\n\n" + TABLE.replace("| Column 1 |", "| ⟦Column 1⟧ |"));
  });
  it("takes a size", () => {
    expect(runEdit("¦", insertTable(1, 1))).toBe(lines("| ⟦Column 1⟧ |", "| -------- |", "|          |"));
  });
});

const T = lines("| a | b |", "| --- | --- |", "| 1 | 2 |");

describe("formatTableAtCursor", () => {
  it("pads the table and keeps the cursor in its cell and place", () => {
    expect(runEdit(lines("| a | b |", "|-|-|", "| lon¦g | 2 |"), formatTableAtCursor)).toBe(
      lines("| a    | b   |", "| ---- | --- |", "| lon¦g | 2   |"),
    );
  });
  it("does nothing outside a table", () => expect(runEdit("te¦xt", formatTableAtCursor)).toBe("te¦xt"));
  it("does nothing when the table is padded already", () => {
    const padded = lines("| a   | b   |", "| --- | --- |", "| 1¦   | 2   |");
    expect(runEdit(padded, formatTableAtCursor)).toBe(padded);
  });
});

describe("formatTablesInSelection", () => {
  it("pads every table that the selection touches", () => {
    const input = lines("⟦|a|", "|-|", "", "text", "", "|b|", "|-|⟧", "", "|c|", "|-|");
    expect(runEdit(input, formatTablesInSelection)).toContain("| a   |");
    const out = runEdit(input, formatTablesInSelection);
    expect(out).toContain("| b   |");
    expect(out).toContain("|c|");
  });
});

describe("rows", () => {
  it("adds a row below the header as the first body row", () => {
    expect(runEdit(lines("| a¦ | b |", "| --- | --- |", "| 1 | 2 |"), addRowBelow)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| ¦    |     |", "| 1   | 2   |"),
    );
  });
  it("adds a row below a body row, in the same column", () => {
    expect(runEdit(lines("| a | b |", "| --- | --- |", "| 1 | 2¦ |"), addRowBelow)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| 1   | 2   |", "|     | ¦    |"),
    );
  });
  it("adds a row above a body row", () => {
    expect(runEdit(lines("| a | b |", "| --- | --- |", "| 1¦ | 2 |"), addRowAbove)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| ¦    |     |", "| 1   | 2   |"),
    );
  });
  it("does not add a row above the header", () => {
    expect(runEdit(lines("| a¦ | b |", "| --- | --- |"), addRowAbove)).toBe(lines("| a¦ | b |", "| --- | --- |"));
  });
  it("deletes a body row", () => {
    expect(runEdit(lines("| a | b |", "| --- | --- |", "| 1¦ | 2 |", "| 3 | 4 |"), deleteRow)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| ¦3   | 4   |"),
    );
  });
  it("deletes the last row and moves the cursor to the row above", () => {
    expect(runEdit(lines("| a | b |", "| --- | --- |", "| 1 | 2 |", "| 3¦ | 4 |"), deleteRow)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| ¦1   | 2   |"),
    );
  });
  it("moves the cursor to the header when the last body row is deleted", () => {
    expect(runEdit(lines("| a | b |", "| --- | --- |", "| 1¦ | 2 |"), deleteRow)).toBe(lines("| ¦a   | b   |", "| --- | --- |"));
  });
  it("does not delete the header or the delimiter row", () => {
    expect(runEdit(T.replace("a", "a¦"), deleteRow)).toBe(T.replace("a", "a¦"));
  });
  it("does nothing outside a table", () => expect(runEdit("x¦", addRowBelow)).toBe("x¦"));
});

describe("columns", () => {
  it("adds a column to the right", () => {
    expect(runEdit(lines("| a¦ | b |", "| --- | --- |", "| 1 | 2 |"), addColumnRight)).toBe(
      lines("| a   | ¦    | b   |", "| --- | --- | --- |", "| 1   |     | 2   |"),
    );
  });
  it("adds a column to the left", () => {
    expect(runEdit(lines("| a | b¦ |", "| --- | --- |", "| 1 | 2 |"), addColumnLeft)).toBe(
      lines("| a   | ¦    | b   |", "| --- | --- | --- |", "| 1   |     | 2   |"),
    );
  });
  it("adds a column when the cursor is on a body row, and keeps the row", () => {
    expect(runEdit(lines("| a | b |", "| --- | --- |", "| 1¦ | 2 |"), addColumnRight)).toBe(
      lines("| a   |     | b   |", "| --- | --- | --- |", "| 1   | ¦    | 2   |"),
    );
  });
  it("deletes a column", () => {
    expect(runEdit(lines("| a | b |", "| --- | --- |", "| 1 | 2¦ |"), deleteColumn)).toBe(
      lines("| a   |", "| --- |", "| ¦1   |"),
    );
  });
  it("does not delete the only column", () => {
    expect(runEdit(lines("| a¦ |", "| --- |"), deleteColumn)).toBe(lines("| a¦ |", "| --- |"));
  });
  it("keeps the alignment of the other columns", () => {
    expect(runEdit(lines("| a¦ | b |", "|:-:|--:|", "| 1 | 2 |"), addColumnRight)).toBe(
      lines("|  a  | ¦    |   b |", "| :-: | --- | --: |", "|  1  |     |   2 |"),
    );
  });
});

describe("alignment", () => {
  const base = lines("| a | b¦ |", "| --- | --- |", "| 1 | 2 |");
  it("aligns a column to the left", () => {
    expect(runEdit(base, alignLeft)).toBe(lines("| a   | b¦   |", "| --- | :-- |", "| 1   | 2   |"));
  });
  it("aligns a column to the center", () => {
    expect(runEdit(base, alignCenter)).toBe(lines("| a   |  b¦  |", "| --- | :-: |", "| 1   |  2  |"));
  });
  it("aligns a column to the right", () => {
    expect(runEdit(base, alignRight)).toBe(lines("| a   |   b¦ |", "| --- | --: |", "| 1   |   2 |"));
  });
});

describe("Tab and Shift+Tab", () => {
  const base = (row: number, col: number) => {
    const rows = [
      ["a", "b"],
      null,
      ["1", "2"],
      ["3", "4"],
    ];
    return [
      "| " + rows[0]!.map((c, i) => (row === 0 && col === i ? `⟦${c}⟧` : c)).join(" | ") + " |",
      "| --- | --- |",
      "| " + rows[2]!.map((c, i) => (row === 2 && col === i ? `⟦${c}⟧` : c)).join(" | ") + " |",
      "| " + rows[3]!.map((c, i) => (row === 3 && col === i ? `⟦${c}⟧` : c)).join(" | ") + " |",
    ].join("\n");
  };

  it("goes to the next cell in the row and selects its text", () => {
    expect(runEdit(base(0, 0).replace("⟦a⟧", "a¦"), tableNextCell)).toBe(
      lines("| a   | ⟦b⟧   |", "| --- | --- |", "| 1   | 2   |", "| 3   | 4   |"),
    );
  });
  it("goes from the last cell of the header to the first body cell, past the delimiter row", () => {
    expect(runEdit(base(0, 1).replace("⟦b⟧", "b¦"), tableNextCell)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| ⟦1⟧   | 2   |", "| 3   | 4   |"),
    );
  });
  it("goes from the end of a row to the start of the next row", () => {
    expect(runEdit(base(2, 1).replace("⟦2⟧", "2¦"), tableNextCell)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| 1   | 2   |", "| ⟦3⟧   | 4   |"),
    );
  });
  it("adds a row at the last cell of the last row", () => {
    expect(runEdit(base(3, 1).replace("⟦4⟧", "4¦"), tableNextCell)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| 1   | 2   |", "| 3   | 4   |", "| ¦    |     |"),
    );
  });
  it("pads the table when it moves", () => {
    expect(runEdit(lines("| a¦ | b |", "|-|-|", "| long | 2 |"), tableNextCell)).toBe(
      lines("| a    | ⟦b⟧   |", "| ---- | --- |", "| long | 2   |"),
    );
  });
  it("selects nothing in an empty cell, and puts the cursor in it", () => {
    expect(runEdit(lines("| a¦ |  |", "|-|-|"), tableNextCell)).toBe(lines("| a   | ¦    |", "| --- | --- |"));
  });
  it("adds a first body row at the end of a table with only a header", () => {
    expect(runEdit(lines("| a | b¦ |", "|-|-|"), tableNextCell)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| ¦    |     |"),
    );
  });
  it("goes to the previous cell", () => {
    expect(runEdit(base(2, 1).replace("⟦2⟧", "2¦"), tablePreviousCell)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| ⟦1⟧   | 2   |", "| 3   | 4   |"),
    );
  });
  it("goes from the first cell of a row to the last cell of the row above", () => {
    expect(runEdit(base(3, 0).replace("⟦3⟧", "3¦"), tablePreviousCell)).toBe(
      lines("| a   | b   |", "| --- | --- |", "| 1   | ⟦2⟧   |", "| 3   | 4   |"),
    );
  });
  it("goes from the first body row to the header", () => {
    expect(runEdit(base(2, 0).replace("⟦1⟧", "1¦"), tablePreviousCell)).toBe(
      lines("| a   | ⟦b⟧   |", "| --- | --- |", "| 1   | 2   |", "| 3   | 4   |"),
    );
  });
  it("stays at the first cell of the header", () => {
    expect(runEdit(base(0, 0).replace("⟦a⟧", "a¦"), tablePreviousCell)).toBe(
      lines("| ⟦a⟧   | b   |", "| --- | --- |", "| 1   | 2   |", "| 3   | 4   |"),
    );
  });
  it("does nothing outside a table", () => expect(runEdit("te¦xt", tableNextCell)).toBe("te¦xt"));
});
