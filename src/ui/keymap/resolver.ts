import { parseKey } from "./keys";
import { evalWhen, type WhenContext } from "./when";

export interface Binding {
  /** One stroke, or a chord of strokes, such as "ctrl+k ctrl+d". */
  key: string;
  /** A command id. A leading "-" removes the earlier binding of that command to that key. */
  command: string;
  when?: string;
  args?: unknown;
}

interface Compiled {
  strokes: string[];
  command: string;
  when: string | undefined;
  args: unknown;
}

export type Resolution =
  | { type: "run"; command: string; args: unknown }
  | { type: "pending" }
  | { type: "cancelled" }
  | { type: "none" };

/**
 * Turn layers of bindings into one list. Layers run from low to high
 * priority, so a later layer wins. A binding whose command starts with "-"
 * removes earlier bindings with the same key and the same command.
 * A binding that cannot be parsed is skipped, and reported in `errors`.
 */
export function compileLayers(
  layers: Binding[][],
  isMac: boolean,
): { bindings: Compiled[]; errors: string[] } {
  let list: Compiled[] = [];
  const errors: string[] = [];
  for (const layer of layers) {
    for (const b of layer) {
      if (!b || typeof b.key !== "string" || typeof b.command !== "string") {
        errors.push(`Bad keybinding: ${JSON.stringify(b)}`);
        continue;
      }
      let strokes: string[];
      try {
        strokes = parseKey(b.key, isMac);
      } catch (e) {
        errors.push(`Bad keybinding "${b.key}": ${(e as Error).message}`);
        continue;
      }
      const id = strokes.join(" ");
      if (b.command.startsWith("-")) {
        const target = b.command.slice(1);
        list = list.filter((c) => !(c.strokes.join(" ") === id && c.command === target));
      } else {
        list.push({ strokes, command: b.command, when: b.when, args: b.args });
      }
    }
  }
  return { bindings: list, errors };
}

/** A keymap that turns key strokes into commands. It keeps the state of a chord. */
export class Keymap {
  private bindings: Compiled[];
  readonly errors: string[];
  private pending: string[] = [];

  constructor(layers: Binding[][], isMac: boolean) {
    const { bindings, errors } = compileLayers(layers, isMac);
    this.bindings = bindings;
    this.errors = errors;
  }

  /** Reset the state of a chord, for example after a timeout. */
  reset(): void {
    this.pending = [];
  }

  /** The keys of the bindings of a command, for display. */
  keysFor(command: string): string[] {
    return this.bindings.filter((b) => b.command === command).map((b) => b.strokes.join(" "));
  }

  /**
   * Feed one stroke. `candidates` are the strokes that the key event can
   * match. The first candidate that matches a binding wins.
   */
  feed(candidates: string[], ctx: WhenContext): Resolution {
    for (const stroke of candidates) {
      const seq = [...this.pending, stroke];
      const live = this.bindings.filter(
        (b) => b.strokes.length >= seq.length && seq.every((s, i) => b.strokes[i] === s) && evalWhen(b.when, ctx),
      );
      if (live.length === 0) continue;
      const longer = live.some((b) => b.strokes.length > seq.length);
      if (longer) {
        this.pending = seq;
        return { type: "pending" };
      }
      // The last binding in the list has the highest priority.
      const hit = live[live.length - 1]!;
      this.pending = [];
      return { type: "run", command: hit.command, args: hit.args };
    }
    // No match. A key that breaks a chord cancels it, and the app swallows the key.
    const wasPending = this.pending.length > 0;
    this.pending = [];
    return wasPending ? { type: "cancelled" } : { type: "none" };
  }
}
