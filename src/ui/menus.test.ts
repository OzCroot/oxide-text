import { describe, expect, it } from "vitest";
import { createRegistry } from "./commands";
import { menus } from "./menus";

describe("menus", () => {
  const registry = createRegistry();

  it("has the ten menus, in order", () => {
    expect(menus.map((m) => m.label)).toEqual(["File", "Edit", "Selection", "Find", "View", "Goto", "Tools", "Project", "Preferences", "Help"]);
  });

  it("has unique menu ids", () => {
    expect(new Set(menus.map((m) => m.id)).size).toBe(menus.length);
  });

  it("names only commands that exist", () => {
    const missing: string[] = [];
    for (const m of menus) for (const i of m.items) if ("command" in i && !registry.has(i.command)) missing.push(`${m.id}: ${i.command}`);
    expect(missing).toEqual([]);
  });

  it("does not start or end a menu with a separator, or repeat one", () => {
    for (const m of menus) {
      const flags = m.items.map((i) => "separator" in i);
      expect(flags[0], `${m.id} starts`).not.toBe(true);
      expect(flags[flags.length - 1], `${m.id} ends`).not.toBe(true);
      for (let i = 1; i < flags.length; i++) expect(flags[i] && flags[i - 1], `${m.id} repeats`).toBeFalsy();
    }
  });
});
