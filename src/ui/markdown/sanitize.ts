import DOMPurify from "dompurify";
import { hasScheme, joinPath, safeDecode } from "./paths";

export interface SanitizeOptions {
  /** The folder of the document, or null if it was never saved. */
  baseDir: string | null;
  /** Load images from the web. Off by default, for privacy. */
  remoteImages: boolean;
  /** Turn the path of a local image into a URL that the webview can load. */
  toAssetUrl(absolutePath: string): string;
}

// The sanitizer is the only barrier between hostile Markdown and the webview.
// The webview has access to the app commands, so treat every change here with care.
// Tests: sanitize.test.ts.

const FORBID_TAGS = [
  "style", "link", "meta", "base", "script", "noscript", "template",
  "iframe", "frame", "frameset", "object", "embed", "applet",
  "form", "button", "textarea", "select", "option", "dialog",
  "video", "audio", "source", "track", "picture", "canvas", "map", "area",
  "svg", "math",
];
// `style` and `srcset` can load remote files. The others are old or form attributes.
const FORBID_ATTR = ["style", "srcset", "sizes", "background", "poster", "longdesc", "ping", "formaction", "action"];
// Only these schemes are allowed in a URL. A relative URL is allowed too.
const ALLOWED_URI = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

let current: SanitizeOptions | null = null;
let ready = false;

function init(): void {
  if (ready) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    const opts = current;
    if (!opts) return;
    const el = node as Element;
    const tag = el.tagName;

    if (tag === "A") {
      el.removeAttribute("target");
      if (el.hasAttribute("href")) el.setAttribute("rel", "noopener noreferrer");
    } else if (tag === "INPUT") {
      // Only the checkbox of a task list. A form control has no use here.
      if (el.getAttribute("type") !== "checkbox") el.remove();
      else el.setAttribute("disabled", "");
    } else if (tag === "IMG") {
      rewriteImage(el, opts);
    }
  });
  ready = true;
}

function rewriteImage(img: Element, opts: SanitizeOptions): void {
  const src = img.getAttribute("src");
  if (!src) return;
  if (src.startsWith("data:")) {
    // Only raster images. No data: document, and no SVG.
    if (!/^data:image\/(png|jpe?g|gif|webp|bmp|avif)[;,]/i.test(src)) img.removeAttribute("src");
    return;
  }

  if (hasScheme(src)) {
    // http, https, or protocol-relative.
    if (!opts.remoteImages) {
      img.removeAttribute("src");
      img.classList.add("md-blocked-image");
      img.setAttribute("title", "Remote image blocked");
    }
    return;
  }

  const decoded = safeDecode(src);
  const isAbsolute = decoded.startsWith("/") || /^[A-Za-z]:[\\/]/.test(decoded);
  if (!isAbsolute && opts.baseDir === null) {
    img.removeAttribute("src");
    img.classList.add("md-blocked-image");
    img.setAttribute("title", "Save the document to show images with a relative path");
    return;
  }
  img.setAttribute("src", opts.toAssetUrl(isAbsolute ? decoded : joinPath(opts.baseDir as string, decoded)));
}

/** Clean HTML from `renderMarkdown`. Needs a DOM (a webview, or jsdom in tests). */
export function sanitizeHtml(html: string, options: SanitizeOptions): string {
  init();
  current = options;
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS,
      FORBID_ATTR,
      ALLOWED_URI_REGEXP: ALLOWED_URI,
      ALLOW_DATA_ATTR: true,
    });
  } finally {
    current = null;
  }
}
