import { invoke } from "@tauri-apps/api/core";
import { extensionOf } from "./paths";
import { renderMarkdown } from "./render";
import { sanitizeHtml } from "./sanitize";

/** Marks a local image in the sanitized HTML, until `inlineLocalImages` swaps it for a data: URL. */
const LOCAL = "oxide-local:";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  avif: "image/avif",
  ico: "image/x-icon",
};

export function mimeOf(path: string): string {
  return MIME[extensionOf(path)] ?? "application/octet-stream";
}

export function toBase64(bytes: Uint8Array): string {
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(s);
}

/** Replace each local image with a data: URL, so the HTML needs no other file. */
async function inlineLocalImages(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const cache = new Map<string, string | null>();
  for (const img of Array.from(doc.querySelectorAll("img"))) {
    const src = img.getAttribute("src");
    if (!src?.startsWith(LOCAL)) continue;
    const path = src.slice(LOCAL.length);
    if (!cache.has(path)) {
      try {
        const buf = await invoke<ArrayBuffer>("read_image", { path });
        cache.set(path, `data:${mimeOf(path)};base64,${toBase64(new Uint8Array(buf))}`);
      } catch {
        cache.set(path, null);
      }
    }
    const url = cache.get(path);
    if (url) img.setAttribute("src", url);
    else {
      img.removeAttribute("src");
      img.classList.add("md-blocked-image");
    }
  }
  return doc.body.innerHTML;
}

export interface ExportOptions {
  baseDir: string | null;
  remoteImages: boolean;
}

/** The sanitized HTML of a document, with local images inlined. */
export async function renderSelfContained(text: string, opts: ExportOptions): Promise<string> {
  const html = sanitizeHtml(renderMarkdown(text), {
    baseDir: opts.baseDir,
    remoteImages: opts.remoteImages,
    toAssetUrl: (p) => `${LOCAL}${p}`,
  });
  return inlineLocalImages(html);
}

const STYLE = `
:root{color-scheme:light dark}
body{font:16px/1.65 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem}
h1,h2,h3,h4,h5,h6{line-height:1.25;margin:1.6em 0 .6em}
h1{font-size:2em;border-bottom:1px solid #8884;padding-bottom:.2em}h2{font-size:1.5em;border-bottom:1px solid #8884;padding-bottom:.2em}
a{color:#2563eb}code,pre{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em}
code{background:#8882;padding:.1em .3em;border-radius:4px}pre{background:#8882;padding:1rem;overflow:auto;border-radius:6px}pre code{background:none;padding:0}
blockquote{margin:1em 0;padding:0 1em;border-left:4px solid #8886;color:#6b7280}
table{border-collapse:collapse}th,td{border:1px solid #8886;padding:.35em .7em}th{background:#8881}
img{max-width:100%}hr{border:0;border-top:1px solid #8886;margin:2em 0}
.task-list-item{list-style:none}.task-list-item input{margin:0 .5em 0 -1.4em}
.md-front-matter{background:#8881;border-radius:6px;padding:.4em .8em;margin-bottom:1em}
.footnotes{font-size:.9em;border-top:1px solid #8886;margin-top:2em}
.md-blocked-image{display:inline-block;border:1px dashed #8886;padding:.2em .5em}
`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A complete HTML page. It has no script, and its content policy allows only inline style and data images (and https images if allowed). */
export function htmlDocument(title: string, bodyHtml: string, remoteImages: boolean): string {
  const img = remoteImages ? "data: https:" : "data:";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${img}; style-src 'unsafe-inline'">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

/** Put HTML and plain text on the clipboard, so a rich text editor pastes formatted text. */
export async function copyRichText(html: string, plain: string): Promise<void> {
  const wrapped = `<!doctype html><meta charset="utf-8">${html}`;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([wrapped], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(plain);
  }
}
