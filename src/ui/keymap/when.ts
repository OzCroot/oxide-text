/** Context keys, such as `editorFocus`. A key that is not set is false. */
export type WhenContext = Record<string, boolean>;

/**
 * Evaluate a `when` clause. The grammar is: `key`, `!key`, and `&&`.
 * An empty or missing clause is true.
 */
export function evalWhen(when: string | undefined, ctx: WhenContext): boolean {
  if (!when || !when.trim()) return true;
  return when.split("&&").every((term) => {
    const t = term.trim();
    if (t.startsWith("!")) return !ctx[t.slice(1).trim()];
    return !!ctx[t];
  });
}
