import { describe, expect, it } from "vitest";
import { compileLayers, Keymap, type Binding } from "./resolver";

const win = (...layers: Binding[][]) => new Keymap(layers, false);

describe("Keymap", () => {
  it("runs the command of a matching key", () => {
    const k = win([{ key: "ctrl+d", command: "a" }]);
    expect(k.feed(["ctrl+d"], {})).toEqual({ type: "run", command: "a", args: undefined });
  });

  it("returns none for an unbound key", () => {
    expect(win([]).feed(["ctrl+d"], {})).toEqual({ type: "none" });
  });

  it("lets a later layer win", () => {
    const k = win([{ key: "ctrl+d", command: "default" }], [{ key: "ctrl+d", command: "user" }]);
    expect(k.feed(["ctrl+d"], {})).toMatchObject({ command: "user" });
  });

  it("removes a binding with a leading minus", () => {
    const k = win([{ key: "ctrl+d", command: "a" }], [{ key: "ctrl+d", command: "-a" }]);
    expect(k.feed(["ctrl+d"], {})).toEqual({ type: "none" });
  });

  it("removes only the named command", () => {
    const k = win([{ key: "ctrl+d", command: "a" }, { key: "ctrl+d", command: "b", when: "x" }], [{ key: "ctrl+d", command: "-b" }]);
    expect(k.feed(["ctrl+d"], { x: true })).toMatchObject({ command: "a" });
  });

  it("checks the when clause", () => {
    const k = win([{ key: "ctrl+d", command: "a", when: "editorFocus" }]);
    expect(k.feed(["ctrl+d"], {})).toEqual({ type: "none" });
    expect(k.feed(["ctrl+d"], { editorFocus: true })).toMatchObject({ command: "a" });
  });

  it("supports a negated when clause and &&", () => {
    const k = win([{ key: "ctrl+d", command: "a", when: "editorFocus && !readOnly" }]);
    expect(k.feed(["ctrl+d"], { editorFocus: true, readOnly: true })).toEqual({ type: "none" });
    expect(k.feed(["ctrl+d"], { editorFocus: true })).toMatchObject({ command: "a" });
  });

  it("falls back to the next candidate stroke", () => {
    const k = win([{ key: "ctrl+shift+\\", command: "a" }]);
    expect(k.feed(["ctrl+shift+|", "ctrl+shift+\\"], {})).toMatchObject({ command: "a" });
  });

  it("handles a chord", () => {
    const k = win([{ key: "ctrl+k ctrl+d", command: "skip" }]);
    expect(k.feed(["ctrl+k"], {})).toEqual({ type: "pending" });
    expect(k.feed(["ctrl+d"], {})).toMatchObject({ type: "run", command: "skip" });
  });

  it("cancels a chord when the next key does not match", () => {
    const k = win([{ key: "ctrl+k ctrl+d", command: "skip" }]);
    k.feed(["ctrl+k"], {});
    expect(k.feed(["ctrl+x"], {})).toEqual({ type: "cancelled" });
    // The chord state is cleared.
    expect(k.feed(["ctrl+d"], {})).toEqual({ type: "none" });
  });

  it("waits when a key is both a binding and the start of a chord", () => {
    const k = win([{ key: "ctrl+k", command: "short" }, { key: "ctrl+k ctrl+d", command: "long" }]);
    expect(k.feed(["ctrl+k"], {})).toEqual({ type: "pending" });
  });

  it("passes args on", () => {
    const k = win([{ key: "alt+1", command: "tab.focusPinned", args: 1 }]);
    expect(k.feed(["alt+1"], {})).toEqual({ type: "run", command: "tab.focusPinned", args: 1 });
  });

  it("reports a bad binding and keeps the others", () => {
    const { bindings, errors } = compileLayers(
      [[{ key: "hyper+a", command: "x" }, { key: "ctrl+b", command: "y" }, { command: "z" } as unknown as Binding]],
      false,
    );
    expect(bindings.map((b) => b.command)).toEqual(["y"]);
    expect(errors).toHaveLength(2);
  });

  it("uses meta for mod on macOS", () => {
    const k = new Keymap([[{ key: "mod+d", command: "a" }]], true);
    expect(k.feed(["meta+d"], {})).toMatchObject({ command: "a" });
  });

  it("lists the keys of a command", () => {
    const k = win([{ key: "mod+shift+z", command: "redo" }, { key: "mod+y", command: "redo" }]);
    expect(k.keysFor("redo")).toEqual(["ctrl+shift+z", "ctrl+y"]);
  });
});
