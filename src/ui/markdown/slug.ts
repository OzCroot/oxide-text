/** A heading id for anchor links, in the style of GitHub: "Hello, World!" gives "hello-world". */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

/** Makes unique ids: the second "Intro" becomes "intro-1". */
export function uniqueSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text) => {
    const base = slugify(text) || "section";
    const n = seen.get(base);
    if (n === undefined) {
      seen.set(base, 0);
      return base;
    }
    let next = n + 1;
    let id = `${base}-${next}`;
    while (seen.has(id)) id = `${base}-${++next}`;
    seen.set(base, next);
    seen.set(id, 0);
    return id;
  };
}
