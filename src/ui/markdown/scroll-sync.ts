// Scroll sync between the editor and the preview. The preview marks each block
// with `data-line` (the source line). We know the top of some lines in both
// panes, and fill in the rest by interpolation.

export interface Anchor {
  line: number;
  top: number;
}

/** From the preview: the source line at a scroll position. `anchors` are sorted by line and by top. */
export function lineAtTop(anchors: Anchor[], top: number): number {
  if (anchors.length === 0) return 1;
  const first = anchors[0]!;
  if (top <= first.top) return first.line;
  for (let i = 1; i < anchors.length; i++) {
    const b = anchors[i]!;
    if (top < b.top) {
      const a = anchors[i - 1]!;
      const span = b.top - a.top;
      return span <= 0 ? a.line : a.line + ((top - a.top) / span) * (b.line - a.line);
    }
  }
  return anchors[anchors.length - 1]!.line;
}

/** To the preview: the scroll position of a source line. */
export function topAtLine(anchors: Anchor[], line: number): number {
  if (anchors.length === 0) return 0;
  const first = anchors[0]!;
  if (line <= first.line) return first.top;
  for (let i = 1; i < anchors.length; i++) {
    const b = anchors[i]!;
    if (line < b.line) {
      const a = anchors[i - 1]!;
      const span = b.line - a.line;
      return span <= 0 ? a.top : a.top + ((line - a.line) / span) * (b.top - a.top);
    }
  }
  return anchors[anchors.length - 1]!.top;
}

/**
 * Collect the anchors of a preview element. A block with the same line as an
 * earlier block (a nested block) is skipped, so the lines stay increasing.
 */
export function collectAnchors(container: HTMLElement): Anchor[] {
  const base = container.getBoundingClientRect().top - container.scrollTop;
  const out: Anchor[] = [];
  for (const el of container.querySelectorAll<HTMLElement>("[data-line]")) {
    const line = Number(el.dataset.line);
    if (!Number.isFinite(line)) continue;
    const top = el.getBoundingClientRect().top - base;
    const last = out[out.length - 1];
    if (last && (line <= last.line || top < last.top)) continue;
    out.push({ line, top });
  }
  return out;
}
