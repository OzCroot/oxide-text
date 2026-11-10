import { convertFileSrc } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { checkPaths } from "@/lib/api";
import { classifyHref } from "@/markdown/links";
import { renderMarkdown } from "@/markdown/render";
import { sanitizeHtml } from "@/markdown/sanitize";
import { cn } from "@/lib/utils";

/** Above this size the preview shows a note, not the document. The browser would stall. */
const MAX_PREVIEW_CHARS = 2 * 1024 * 1024;
const RENDER_DELAY_MS = 150;

export interface PreviewProps {
  /** The text of the document. Read when `version` changes. */
  getText(): string;
  /** Changes when the text changes. */
  version: number;
  /** The folder of the document, or null if it was never saved. */
  baseDir: string | null;
  remoteImages: boolean;
  className?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Open a file that a link points to. */
  onOpenFile(path: string, anchor: string): void;
  /** A link to a heading of this document was clicked. */
  onAnchor(id: string): void;
  /** Scroll to this heading id after the next render. */
  scrollToId: { id: string; n: number } | null;
}

export function Preview({ getText, version, baseDir, remoteImages, className, scrollRef, onOpenFile, onAnchor, scrollToId }: PreviewProps) {
  const [html, setHtml] = useState("");
  const [tooLarge, setTooLarge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Render after a short pause, so typing stays smooth.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const text = getText();
        if (text.length > MAX_PREVIEW_CHARS) {
          setTooLarge(true);
          setHtml("");
          return;
        }
        setTooLarge(false);
        setError(null);
        setHtml(
          sanitizeHtml(renderMarkdown(text), {
            baseDir,
            remoteImages,
            toAssetUrl: (p) => convertFileSrc(p),
          }),
        );
      } catch (e) {
        setError(String(e));
      }
    }, RENDER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [getText, version, baseDir, remoteImages]);

  const markup = useMemo(() => ({ __html: html }), [html]);

  // Mark links to files that do not exist, and links to headings that do not exist.
  useEffect(() => {
    const root = box.current;
    if (!root || html === "") return;
    let cancelled = false;
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"));
    const files = new Map<string, HTMLAnchorElement[]>();
    for (const a of links) {
      a.classList.remove("md-broken");
      const t = classifyHref(a.getAttribute("href"), baseDir);
      if (t.kind === "anchor") {
        if (t.id !== "" && !root.querySelector(`[id="${CSS.escape(t.id)}"]`)) {
          a.classList.add("md-broken");
          a.title = "No heading with this name";
        }
      } else if (t.kind === "file") {
        const list = files.get(t.path) ?? [];
        list.push(a);
        files.set(t.path, list);
      }
    }
    if (files.size > 0) {
      const paths = [...files.keys()];
      void checkPaths(paths).then((exists) => {
        if (cancelled) return;
        paths.forEach((p, i) => {
          if (exists[i]) return;
          for (const a of files.get(p) ?? []) {
            a.classList.add("md-broken");
            a.title = "File not found";
          }
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [html, baseDir]);

  // Scroll to a heading that a link asked for.
  useEffect(() => {
    if (!scrollToId || html === "") return;
    const el = box.current?.querySelector(`[id="${CSS.escape(scrollToId.id)}"]`);
    el?.scrollIntoView({ block: "start" });
  }, [scrollToId, html]);

  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    // The webview must never navigate. Every link goes through classifyHref.
    e.preventDefault();
    const t = classifyHref(a.getAttribute("href"), baseDir);
    if (t.kind === "anchor") {
      onAnchor(t.id);
      const el = t.id ? box.current?.querySelector(`[id="${CSS.escape(t.id)}"]`) : null;
      el?.scrollIntoView({ block: "start" });
    } else if (t.kind === "external") {
      void openUrl(t.url);
    } else if (t.kind === "file") {
      onOpenFile(t.path, t.anchor);
    }
  };

  return (
    <div ref={scrollRef} className={cn("overflow-auto bg-background", className)}>
      {tooLarge ? (
        <p className="p-6 text-sm text-muted-foreground">This file is too large for the preview (over 2 MB).</p>
      ) : error ? (
        <p role="alert" className="p-6 text-sm">Cannot render the preview: {error}</p>
      ) : (
        <div ref={box} className="md-preview" onClick={onClick} dangerouslySetInnerHTML={markup} />
      )}
    </div>
  );
}
