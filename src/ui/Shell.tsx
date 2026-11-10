import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Outline } from "@/components/Outline";
import { Preview } from "@/components/Preview";
import { StatusBar } from "@/components/StatusBar";
import { TabStrip } from "@/components/TabStrip";
import { markdownKeymap } from "@/commands/markdown-commands";
import { defaultKeymap } from "@/keymap/default-keymap";
import { isModifierOnly, strokesFromEvent } from "@/keymap/keys";
import { Keymap, type Binding } from "@/keymap/resolver";
import { cn } from "@/lib/utils";
import { collectAnchors, lineAtTop, topAtLine, type Anchor } from "@/markdown/scroll-sync";
import type { Settings, ThemeSetting } from "@/settings";
import { useWorkspace } from "@/workspace";

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const CHORD_TIMEOUT_MS = 1500;

interface Props {
  settings: Settings;
  userKeybindings: Binding[];
  theme: "light" | "dark";
  setTheme(t: ThemeSetting): void;
  onKeymapErrors(errors: string[]): void;
}

/** A copy of the rendered document that only the printer shows. Used for the PDF export. */
function PrintCopy({ html, onDone }: { html: string; onDone(): void }) {
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.print();
      } finally {
        setTimeout(onDone, 500);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [html, onDone]);
  return createPortal(<div className="print-root md-preview" dangerouslySetInnerHTML={{ __html: html }} />, document.body);
}

export function Shell({ settings, userKeybindings, theme, setTheme, onKeymapErrors }: Props) {
  const ws = useWorkspace(settings, setTheme, theme);
  const host = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const keymap = useMemo(() => new Keymap([defaultKeymap, markdownKeymap, userKeybindings], IS_MAC), [userKeybindings]);
  useEffect(() => onKeymapErrors(keymap.errors), [keymap, onKeymapErrors]);

  // Create the editor once, then open the first tab.
  const { viewRef, attach } = ws;
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({ parent: host.current, state: EditorState.create({}) });
    viewRef.current = view;
    attach();
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route every key through the keymap. The command registry owns all keys.
  const registryRef = useRef(ws.registry);
  const actionsRef = useRef(ws.actions);
  actionsRef.current = ws.actions;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || isModifierOnly(e)) return;
      const inEditor = !!(document.activeElement && (document.activeElement as HTMLElement).closest(".cm-editor"));
      const res = keymap.feed(strokesFromEvent(e), { editorFocus: inEditor });
      clearTimeout(timer);
      if (res.type === "none") return;
      e.preventDefault();
      e.stopPropagation();
      if (res.type === "pending") {
        timer = setTimeout(() => keymap.reset(), CHORD_TIMEOUT_MS);
        return;
      }
      if (res.type === "run") {
        void registryRef.current
          .run(res.command, { view: viewRef.current, app: actionsRef.current }, res.args)
          .then((found) => {
            if (!found) console.warn(`Keybinding names an unknown command: ${res.command}`);
          });
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [keymap, viewRef]);

  const mode = ws.active?.markdown ? ws.active.mode : "source";

  // Scroll sync in split mode. The preview marks blocks with their source line.
  // The anchors are cached for a short time, because measuring every block is slow.
  const anchorCache = useRef<{ at: number; anchors: Anchor[] }>({ at: 0, anchors: [] });
  const getAnchors = useCallback((): Anchor[] => {
    const pv = previewRef.current;
    if (!pv) return [];
    const now = performance.now();
    if (now - anchorCache.current.at > 300) anchorCache.current = { at: now, anchors: collectAnchors(pv) };
    return anchorCache.current.anchors;
  }, []);

  useEffect(() => {
    if (mode !== "split") return;
    const view = viewRef.current;
    const pv = previewRef.current;
    if (!view || !pv) return;
    let lock: "editor" | "preview" | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hold = (who: "editor" | "preview") => {
      lock = who;
      clearTimeout(timer);
      timer = setTimeout(() => (lock = null), 100);
    };
    const onEditorScroll = () => {
      if (lock === "preview") return;
      const block = view.lineBlockAtHeight(view.scrollDOM.scrollTop);
      const line = view.state.doc.lineAt(block.from).number + (block.height > 0 ? (view.scrollDOM.scrollTop - block.top) / block.height : 0);
      hold("editor");
      pv.scrollTop = topAtLine(getAnchors(), line);
    };
    const onPreviewScroll = () => {
      if (lock === "editor") return;
      const line = lineAtTop(getAnchors(), pv.scrollTop);
      const whole = Math.max(1, Math.min(Math.floor(line), view.state.doc.lines));
      const block = view.lineBlockAt(view.state.doc.line(whole).from);
      hold("preview");
      view.scrollDOM.scrollTop = block.top + (line - whole) * block.height;
    };
    view.scrollDOM.addEventListener("scroll", onEditorScroll, { passive: true });
    pv.addEventListener("scroll", onPreviewScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      view.scrollDOM.removeEventListener("scroll", onEditorScroll);
      pv.removeEventListener("scroll", onPreviewScroll);
    };
  }, [mode, ws.activeId, viewRef, getAnchors]);

  const jumpToHeading = useCallback(
    (line: number) => {
      ws.jumpToLine(line);
      // In preview mode there is no editor to show. Scroll the preview.
      if (mode === "preview" && previewRef.current) {
        previewRef.current.scrollTop = topAtLine(collectAnchors(previewRef.current), line);
      }
    },
    [ws, mode],
  );

  return (
    <div className="flex h-full flex-col">
      <TabStrip
        tabs={ws.tabs}
        activeId={ws.activeId}
        onActivate={ws.activate}
        onClose={(id) => void ws.closeTab(id)}
        onNew={ws.newFile}
      />
      <div className="flex min-h-0 flex-1">
        {ws.outlineOpen && ws.active?.markdown ? (
          <Outline headings={ws.headings} cursorLine={ws.cursor.line} onJump={jumpToHeading} />
        ) : null}
        <div
          ref={host}
          className={cn("min-w-0 overflow-hidden", mode === "preview" ? "hidden" : mode === "split" ? "w-1/2 border-r border-border" : "flex-1")}
        />
        {mode !== "source" ? (
          <Preview
            className={mode === "split" ? "w-1/2" : "flex-1"}
            scrollRef={previewRef}
            getText={ws.getText}
            version={ws.version}
            baseDir={ws.baseDir}
            remoteImages={settings.markdown.remoteImages}
            onOpenFile={(path, anchor) => void ws.openPaths([path], anchor)}
            onAnchor={ws.jumpToAnchor}
            scrollToId={ws.scrollToId}
          />
        ) : null}
      </div>
      <StatusBar
        tab={ws.active}
        cursor={ws.cursor}
        stats={ws.stats}
        onCycleEol={ws.cycleEol}
        onSetMode={ws.setViewMode}
        onToggleOutline={ws.actions.toggleOutline}
        outlineOpen={ws.outlineOpen}
      />
      {ws.printHtml !== null ? <PrintCopy html={ws.printHtml} onDone={ws.clearPrint} /> : null}
    </div>
  );
}
