// Path helpers for the preview and for pasted images. They work on strings, so
// they run the same on every system and need no Node or Tauri API.
// A path uses "/" or "\" (Windows). The result keeps the style of the base path.

function sepOf(path: string): "/" | "\\" {
  return path.includes("\\") && !path.includes("/") ? "\\" : "/";
}

function split(path: string): { root: string; parts: string[] } {
  const p = path.replace(/\\/g, "/");
  const drive = /^[A-Za-z]:/.exec(p)?.[0] ?? "";
  const rest = p.slice(drive.length);
  const absolute = rest.startsWith("/");
  return {
    root: drive + (absolute ? "/" : ""),
    parts: rest.split("/").filter((s) => s !== "" && s !== "."),
  };
}

function normalise(root: string, parts: string[]): string[] {
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      if (out.length > 0 && out[out.length - 1] !== "..") out.pop();
      else if (root === "") out.push(".."); // A relative path may start with "..".
      // An absolute path cannot go above its root.
    } else out.push(part);
  }
  return out;
}

export function dirname(path: string): string {
  const { root, parts } = split(path);
  const dir = parts.slice(0, -1);
  const text = dir.join("/");
  const joined = root + text;
  const out = joined === "" ? (root === "" ? "." : root) : joined;
  return sepOf(path) === "\\" ? out.replace(/\//g, "\\") : out;
}

/** Join a relative path to a base folder, and resolve "." and "..". */
export function joinPath(base: string, rel: string): string {
  const { root, parts } = split(base);
  const relParts = rel.replace(/\\/g, "/").split("/").filter((s) => s !== "" && s !== ".");
  const joined = root + normalise(root, [...parts, ...relParts]).join("/");
  return sepOf(base) === "\\" ? joined.replace(/\//g, "\\") : joined;
}

/**
 * The path of `target` relative to the folder `fromDir`, with "/" separators,
 * for use in a Markdown link. Returns `target` as a plain path with "/" if the
 * two paths have a different root (for example, two Windows drives).
 */
export function relativePath(fromDir: string, target: string): string {
  const a = split(fromDir);
  const b = split(target);
  if (a.root !== b.root) return target.replace(/\\/g, "/");
  const from = normalise(a.root, a.parts);
  const to = normalise(b.root, b.parts);
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i++;
  const up = from.slice(i).map(() => "..");
  const rest = to.slice(i);
  const out = [...up, ...rest].join("/");
  return out === "" ? "." : up.length === 0 ? `./${out}` : out;
}

export function baseName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

/** The file name without its last extension. */
export function stemOf(path: string): string {
  const name = baseName(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export function extensionOf(path: string): string {
  const name = baseName(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** True for a URL with a scheme ("https:", "mailto:") or a protocol-relative URL ("//host"). */
export function hasScheme(url: string): boolean {
  // A Windows drive path ("C:\a") is not a scheme.
  if (/^[A-Za-z]:[\\/]/.test(url)) return false;
  return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url) || url.startsWith("//");
}

/** Split "a/b.md#part" into the path and the anchor (without "#"). */
export function splitAnchor(url: string): { path: string; anchor: string } {
  const i = url.indexOf("#");
  return i === -1 ? { path: url, anchor: "" } : { path: url.slice(0, i), anchor: url.slice(i + 1) };
}

export function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
