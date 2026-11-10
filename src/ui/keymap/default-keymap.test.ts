import { describe, expect, it } from "vitest";
import { createRegistry } from "../commands";
import { defaultKeymap } from "./default-keymap";
import { compileLayers } from "./resolver";

describe("default keymap", () => {
  const registry = createRegistry();

  it("parses without errors on every platform", () => {
    expect(compileLayers([defaultKeymap], false).errors).toEqual([]);
    expect(compileLayers([defaultKeymap], true).errors).toEqual([]);
  });

  it("names only commands that exist", () => {
    const missing = defaultKeymap.filter((b) => !registry.has(b.command)).map((b) => b.command);
    expect(missing).toEqual([]);
  });

  it("has no duplicate key with the same when clause", () => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const b of defaultKeymap) {
      const id = `${compileLayers([[b]], false).bindings[0]!.strokes.join(" ")} [${b.when ?? ""}]`;
      if (seen.has(id)) dups.push(`${id}: ${seen.get(id)} and ${b.command}`);
      seen.set(id, b.command);
    }
    expect(dups).toEqual([]);
  });

  it("keeps Ctrl+K free as a chord prefix", () => {
    const { bindings } = compileLayers([defaultKeymap], false);
    expect(bindings.filter((b) => b.strokes.join(" ") === "ctrl+k")).toEqual([]);
  });

  it("binds the shortcuts from plan section 7.1", () => {
    const keys = (id: string) => compileLayers([defaultKeymap], false).bindings.filter((b) => b.command === id).map((b) => b.strokes.join(" "));
    expect(keys("selection.addNextOccurrence")).toEqual(["ctrl+d"]);
    expect(keys("selection.selectAllOccurrences")).toEqual(["ctrl+shift+l"]);
    expect(keys("lines.moveUp")).toEqual(["alt+up"]);
    expect(keys("lines.copyDown")).toEqual(["alt+shift+down"]);
    expect(keys("comment.toggleLine")).toEqual(["ctrl+/"]);
  });
});
