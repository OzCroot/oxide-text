import { hasScheme, joinPath, safeDecode, splitAnchor } from "./paths";

export type LinkTarget =
  | { kind: "anchor"; id: string }
  | { kind: "external"; url: string }
  | { kind: "file"; path: string; anchor: string }
  | { kind: "none" };

/**
 * Decide what a click on a link in the preview does.
 * - "#part" jumps to a heading in the same document.
 * - A web link opens in the system browser.
 * - A relative path opens that file, and resolves from the folder of the document.
 * `baseDir` is null for a document that was never saved: a relative link then does nothing.
 */
export function classifyHref(href: string | null, baseDir: string | null): LinkTarget {
  if (!href) return { kind: "none" };
  if (href.startsWith("#")) return { kind: "anchor", id: safeDecode(href.slice(1)) };
  if (/^(https?:|mailto:|tel:)/i.test(href)) return { kind: "external", url: href };
  if (hasScheme(href)) return { kind: "none" }; // javascript:, file:, data:, and so on
  if (baseDir === null) return { kind: "none" };
  const { path, anchor } = splitAnchor(href);
  if (path === "") return { kind: "none" };
  const decoded = safeDecode(path);
  // An absolute path stays as it is. A relative path resolves from the document.
  const isAbsolute = decoded.startsWith("/") || /^[A-Za-z]:[\\/]/.test(decoded);
  return { kind: "file", path: isAbsolute ? decoded : joinPath(baseDir, decoded), anchor: safeDecode(anchor) };
}
