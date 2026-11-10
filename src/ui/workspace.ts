import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { ask, message, open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRegistry, type AppActions, type CommandRegistry } from "@/commands";
import { buildExtensions, type EditorHooks } from "@/editor/extensions";
import { formatTablesInText } from "@/editor/commands/tables";
import { canParseMarkdown } from "@/editor/large";
import { extensionForMime, htmlToMarkdown, insertAtSelection, linksForFiles, looksStructural } from "@/editor/paste";
import { openFile, saveFile, saveImage, type Eol } from "@/lib/api";
import { copyRichText, htmlDocument, renderSelfContained } from "@/markdown/export";
import { anchorLine, extractHeadings, type Heading } from "@/markdown/headings";
import { baseName, dirname, extensionOf, joinPath, relativePath, stemOf } from "@/markdown/paths";
import type { Settings, ThemeSetting, ViewMode } from "@/settings";

export interface Tab {
  id: string;
  /** The path on disk, or null for a new file that was never saved. */
  path: string | null;
  title: string;
  encoding: string;
  bom: boolean;
  eol: Eol;
  mixedEol: boolean;
  dirty: boolean;
  /** True for a Markdown file (and a new file). Other files open as plain text, with no styling. */
  markdown: boolean;
  /** True if a Markdown file has a block too long for the Markdown parser, so it opens as plain text. */
  plain: boolean;
  /** Source, preview, or split. A file that is not Markdown has only source. */
  mode: ViewMode;
}

export interface CursorInfo {
  line: number;
  col: number;
  selections: number;
  selectedChars: number;
  selectedWords: number;
}

export interface DocStats {
  words: number;
  chars: number;
  /** Minutes to read, at 200 words a minute. */
  minutes: number;
}

const EOL_CYCLE: Eol[] = ["lf", "crlf", "cr"];
const MARKDOWN_EXT = new Set(["md", "markdown", "mdown", "mkd", "mkdn", "mdwn"]);
const MODE_CYCLE: ViewMode[] = ["source", "split", "preview"];
/** Above this size, the status bar shows no word count, and the outline is off. */
const STATS_MAX_CHARS = 2 * 1024 * 1024;
let nextId = 1;

export function isMarkdownPath(path: string | null): boolean {
  return path === null || MARKDOWN_EXT.has(extensionOf(path));
}

function countWords(text: string): number {
  let n = 0;
  const re = /\S+/g;
  while (re.exec(text)) n++;
  return n;
}

/**
 * The open tabs, and the editor. One CodeMirror view shows the active tab.
 * Each tab keeps its own EditorState, so the text, the undo history, and the
 * selection stay with the tab. The text does not go into React state.
 */
export function useWorkspace(
  settings: Settings,
  setTheme: (t: ThemeSetting) => void,
  currentTheme: "light" | "dark",
) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<CursorInfo>({ line: 1, col: 1, selections: 1, selectedChars: 0, selectedWords: 0 });
  /** Changes when the text of the active tab changes, or the active tab changes. */
  const [version, setVersion] = useState(0);
  const [stats, setStats] = useState<DocStats | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [scrollToId, setScrollToId] = useState<{ id: string; n: number } | null>(null);
  /** The HTML to print. Set while a PDF export runs. */
  const [printHtml, setPrintHtml] = useState<string | null>(null);

  const viewRef = useRef<EditorView | null>(null);
  const states = useRef(new Map<string, EditorState>());
  const tabsRef = useRef<Tab[]>([]);
  const activeRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  tabsRef.current = tabs;
  activeRef.current = activeId;
  settingsRef.current = settings;

  const activeTab = useCallback(() => tabsRef.current.find((t) => t.id === activeRef.current) ?? null, []);

  /** Paste: an image becomes a file and a link, and HTML becomes Markdown. */
  const handlePaste = useCallback((e: ClipboardEvent, view: EditorView): boolean => {
    const tab = activeTab();
    const data = e.clipboardData;
    if (!tab?.markdown || !data) return false;

    const image = Array.from(data.files).find((f) => extensionForMime(f.type));
    if (image) {
      e.preventDefault();
      void (async () => {
        if (!tab.path) {
          await message("Save the file first. A pasted image goes in a folder next to the file.", { title: "oxide-text" });
          return;
        }
        try {
          const dir = joinPath(dirname(tab.path), settingsRef.current.markdown.imageDir);
          const saved = await saveImage(dir, stemOf(tab.path), extensionForMime(image.type)!, await image.arrayBuffer());
          insertAtSelection(view, `![](${encodeURI(relativePath(dirname(tab.path), saved))})`);
        } catch (err) {
          await message(`Cannot save the image\n\n${String(err)}`, { title: "oxide-text", kind: "error" });
        }
      })();
      return true;
    }

    // Do not convert HTML from a code editor: it is only styled text.
    if (settingsRef.current.markdown.pasteHtmlAsMarkdown && !data.types.includes("vscode-editor-data")) {
      const html = data.getData("text/html");
      if (html && looksStructural(html)) {
        e.preventDefault();
        insertAtSelection(view, htmlToMarkdown(html));
        return true;
      }
    }
    return false;
  }, [activeTab]);

  const hooks = useMemo<EditorHooks>(
    () => ({
      onDocChanged: () => {
        const id = activeRef.current;
        if (!id) return;
        setTabs((ts) => ts.map((t) => (t.id === id && !t.dirty ? { ...t, dirty: true } : t)));
        setVersion((v) => v + 1);
      },
      onSelectionChanged: (view) => {
        const sel = view.state.selection;
        const head = sel.main.head;
        const line = view.state.doc.lineAt(head);
        let chars = 0;
        let words = 0;
        for (const r of sel.ranges) {
          chars += r.to - r.from;
          // Count words only in a short selection. A selection of the whole file is not worth the time.
          if (chars <= 200_000 && r.to > r.from) words += countWords(view.state.sliceDoc(r.from, r.to));
        }
        setCursor({ line: line.number, col: head - line.from + 1, selections: sel.ranges.length, selectedChars: chars, selectedWords: words });
      },
      onPaste: handlePaste,
    }),
    [handlePaste],
  );

  /** A new editor state. A file with a very long block opens as plain text. */
  const newState = useCallback(
    (text: string, markdown: boolean) => {
      const parse = markdown && canParseMarkdown(text);
      return {
        state: EditorState.create({ doc: text, extensions: buildExtensions(settings, hooks, parse) }),
        plain: markdown && !parse,
      };
    },
    [settings, hooks],
  );

  const activate = useCallback((id: string) => {
    const view = viewRef.current;
    if (!view) return;
    const current = activeRef.current;
    if (current) states.current.set(current, view.state);
    const next = states.current.get(id);
    if (!next) return;
    view.setState(next);
    activeRef.current = id;
    setActiveId(id);
    setVersion((v) => v + 1);
    view.focus();
    const head = next.selection.main.head;
    const line = next.doc.lineAt(head);
    setCursor({ line: line.number, col: head - line.from + 1, selections: next.selection.ranges.length, selectedChars: 0, selectedWords: 0 });
  }, []);

  const addTab = useCallback(
    (tab: Omit<Tab, "id" | "dirty" | "plain" | "markdown" | "mode">, text: string) => {
      const id = `tab-${nextId++}`;
      const markdown = isMarkdownPath(tab.path);
      const { state, plain } = newState(text, markdown);
      states.current.set(id, state);
      const full: Tab = {
        ...tab,
        id,
        dirty: false,
        markdown,
        plain,
        mode: markdown ? settingsRef.current.markdown.defaultMode : "source",
      };
      setTabs((ts) => [...ts, full]);
      tabsRef.current = [...tabsRef.current, full];
      activate(id);
      return id;
    },
    [activate, newState],
  );

  const textOf = useCallback((id: string): string => {
    const view = viewRef.current;
    const state = id === activeRef.current && view ? view.state : states.current.get(id);
    return state ? state.doc.toString() : "";
  }, []);

  const getText = useCallback(() => {
    const id = activeRef.current;
    return id ? textOf(id) : "";
  }, [textOf]);

  const newFile = useCallback(() => {
    addTab(
      { path: null, title: "Untitled", encoding: "UTF-8", bom: false, eol: settings.files.defaultEol, mixedEol: false },
      "",
    );
  }, [addTab, settings.files.defaultEol]);

  const jumpToLine = useCallback((line: number) => {
    const view = viewRef.current;
    if (!view) return;
    const l = view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines)));
    view.dispatch({
      selection: EditorSelection.cursor(l.from),
      effects: EditorView.scrollIntoView(l.from, { y: "start", yMargin: 8 }),
    });
    view.focus();
  }, []);

  /** Jump to the heading that an anchor names, in the editor and in the preview. */
  const jumpToAnchor = useCallback(
    (id: string) => {
      const line = anchorLine(getText(), id);
      if (line !== null) jumpToLine(line);
      setScrollToId((s) => ({ id, n: (s?.n ?? 0) + 1 }));
    },
    [getText, jumpToLine],
  );

  const openPaths = useCallback(
    async (paths: string[], anchor = "") => {
      for (const path of paths) {
        const existing = tabsRef.current.find((t) => t.path === path);
        if (existing) {
          activate(existing.id);
        } else {
          try {
            const f = await openFile(path);
            addTab(
              { path, title: baseName(path), encoding: f.encoding, bom: f.bom, eol: f.eol, mixedEol: f.mixed_eol },
              f.text,
            );
          } catch (e) {
            await message(`Cannot open ${path}\n\n${String(e)}`, { title: "oxide-text", kind: "error" });
            continue;
          }
        }
        if (anchor) jumpToAnchor(anchor);
      }
    },
    [activate, addTab, jumpToAnchor],
  );

  const openFiles = useCallback(async () => {
    const picked = await open({ multiple: true, directory: false });
    if (!picked) return;
    await openPaths(Array.isArray(picked) ? picked : [picked]);
  }, [openPaths]);

  /** Replace the text of a tab with a changed copy, as one edit. Only the changed middle is replaced, so the cursor stays. */
  const applyWholeText = useCallback((id: string, from: string, to: string) => {
    let start = 0;
    const max = Math.min(from.length, to.length);
    while (start < max && from.charCodeAt(start) === to.charCodeAt(start)) start++;
    let endFrom = from.length;
    let endTo = to.length;
    while (endFrom > start && endTo > start && from.charCodeAt(endFrom - 1) === to.charCodeAt(endTo - 1)) {
      endFrom--;
      endTo--;
    }
    const changes = { from: start, to: endFrom, insert: to.slice(start, endTo) };
    const view = viewRef.current;
    if (id === activeRef.current && view) view.dispatch({ changes, userEvent: "input.format" });
    else {
      const st = states.current.get(id);
      if (st) states.current.set(id, st.update({ changes }).state);
    }
  }, []);

  const saveTab = useCallback(async (id: string, as: boolean): Promise<boolean> => {
    const tab = tabsRef.current.find((t) => t.id === id);
    if (!tab) return false;
    let path = tab.path;
    if (as || !path) {
      const picked = await save({ defaultPath: path ?? undefined });
      if (!picked) return false;
      path = picked;
    }
    try {
      let text = textOf(id);
      if (tab.markdown && !tab.plain && settingsRef.current.markdown.formatTablesOnSave) {
        const formatted = formatTablesInText(text);
        if (formatted !== text) {
          applyWholeText(id, text, formatted);
          text = formatted;
        }
      }
      await saveFile({ path, text, encoding: tab.encoding, bom: tab.bom, eol: tab.eol });
    } catch (e) {
      await message(`Cannot save ${path}\n\n${String(e)}`, { title: "oxide-text", kind: "error" });
      return false;
    }
    const savedPath = path;
    setTabs((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, path: savedPath, title: baseName(savedPath), dirty: false, mixedEol: false } : t,
      ),
    );
    return true;
  }, [textOf, applyWholeText]);

  const closeTabById = useCallback(
    async (id: string) => {
      const tab = tabsRef.current.find((t) => t.id === id);
      if (!tab) return;
      if (tab.dirty) {
        const discard = await ask(`${tab.title} has unsaved changes. Close it and lose the changes?`, {
          title: "oxide-text",
          kind: "warning",
          okLabel: "Discard",
          cancelLabel: "Cancel",
        });
        if (!discard) return;
      }
      const list = tabsRef.current;
      const index = list.findIndex((t) => t.id === id);
      const rest = list.filter((t) => t.id !== id);
      states.current.delete(id);
      if (rest.length === 0) {
        activeRef.current = null;
        setTabs([]);
        tabsRef.current = [];
        newFile();
        return;
      }
      if (id === activeRef.current) {
        const next = rest[Math.min(index, rest.length - 1)]!;
        activeRef.current = null; // The closed tab has no state to keep.
        setTabs(rest);
        tabsRef.current = rest;
        activate(next.id);
      } else {
        setTabs(rest);
        tabsRef.current = rest;
      }
    },
    [activate, newFile],
  );

  const cycleTab = useCallback(
    (step: 1 | -1) => {
      const list = tabsRef.current;
      if (list.length < 2) return;
      const i = list.findIndex((t) => t.id === activeRef.current);
      activate(list[(i + step + list.length) % list.length]!.id);
    },
    [activate],
  );

  const cycleEol = useCallback(() => {
    const id = activeRef.current;
    if (!id) return;
    setTabs((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, eol: EOL_CYCLE[(EOL_CYCLE.indexOf(t.eol) + 1) % EOL_CYCLE.length]!, mixedEol: false, dirty: true } : t,
      ),
    );
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    const id = activeRef.current;
    if (!id) return;
    setTabs((ts) => ts.map((t) => (t.id === id && t.markdown ? { ...t, mode } : t)));
    // The editor was hidden in preview mode. Tell it to measure itself again.
    requestAnimationFrame(() => viewRef.current?.requestMeasure());
  }, []);

  const cycleViewMode = useCallback(() => {
    const tab = activeTab();
    if (!tab?.markdown) return;
    setViewMode(MODE_CYCLE[(MODE_CYCLE.indexOf(tab.mode) + 1) % MODE_CYCLE.length]!);
  }, [activeTab, setViewMode]);

  /** Text to export: the selection if there is one, else the whole document. */
  const exportSource = useCallback((): { text: string; baseDir: string | null; title: string } => {
    const tab = activeTab();
    const view = viewRef.current;
    const sel = view?.state.selection.main;
    const text = view && sel && !sel.empty ? view.state.sliceDoc(sel.from, sel.to) : getText();
    return { text, baseDir: tab?.path ? dirname(tab.path) : null, title: tab ? stemOf(tab.title) : "Untitled" };
  }, [activeTab, getText]);

  const exportHtml = useCallback(async () => {
    const tab = activeTab();
    if (!tab) return;
    const { text, baseDir, title } = exportSource();
    const target = await save({
      defaultPath: `${stemOf(tab.title)}.html`,
      filters: [{ name: "HTML", extensions: ["html"] }],
    });
    if (!target) return;
    try {
      const remote = settingsRef.current.markdown.remoteImages;
      const body = await renderSelfContained(text, { baseDir, remoteImages: remote });
      await saveFile({ path: target, text: htmlDocument(title, body, remote), encoding: "UTF-8", bom: false, eol: "lf" });
    } catch (e) {
      await message(`Cannot export\n\n${String(e)}`, { title: "oxide-text", kind: "error" });
    }
  }, [activeTab, exportSource]);

  const exportPdf = useCallback(async () => {
    if (!activeTab()) return;
    const { text, baseDir } = exportSource();
    try {
      setPrintHtml(await renderSelfContained(text, { baseDir, remoteImages: settingsRef.current.markdown.remoteImages }));
    } catch (e) {
      await message(`Cannot export\n\n${String(e)}`, { title: "oxide-text", kind: "error" });
    }
  }, [activeTab, exportSource]);

  const copyAsRichText = useCallback(async () => {
    const { text, baseDir } = exportSource();
    try {
      const html = await renderSelfContained(text, { baseDir, remoteImages: settingsRef.current.markdown.remoteImages });
      await copyRichText(html, text);
    } catch (e) {
      await message(`Cannot copy\n\n${String(e)}`, { title: "oxide-text", kind: "error" });
    }
  }, [exportSource]);

  const actions: AppActions = useMemo(
    () => ({
      newFile,
      openFiles,
      save: async () => {
        if (activeRef.current) await saveTab(activeRef.current, false);
      },
      saveAs: async () => {
        if (activeRef.current) await saveTab(activeRef.current, true);
      },
      closeTab: async () => {
        if (activeRef.current) await closeTabById(activeRef.current);
      },
      nextTab: () => cycleTab(1),
      previousTab: () => cycleTab(-1),
      toggleTheme: () => setTheme(currentTheme === "dark" ? "light" : "dark"),
      setViewMode,
      cycleViewMode,
      toggleOutline: () => setOutlineOpen((o) => !o),
      exportHtml,
      exportPdf,
      copyAsRichText,
    }),
    [newFile, openFiles, saveTab, closeTabById, cycleTab, setTheme, currentTheme, setViewMode, cycleViewMode, exportHtml, exportPdf, copyAsRichText],
  );

  const registry: CommandRegistry = useMemo(() => createRegistry(), []);

  /** Show the first tab in a new editor view. React StrictMode makes a view twice in dev. */
  const attach = useCallback(() => {
    const id = activeRef.current ?? tabsRef.current[0]?.id;
    if (id && states.current.has(id)) {
      activeRef.current = null; // The new view is empty. Do not save its state over the tab.
      activate(id);
    } else {
      newFile();
    }
  }, [activate, newFile]);

  // Word count and reading time, after a pause.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !activeId) return;
    const timer = setTimeout(() => {
      const doc = viewRef.current?.state.doc;
      if (!doc || doc.length > STATS_MAX_CHARS) return setStats(null);
      const words = countWords(doc.toString());
      setStats({ words, chars: doc.length, minutes: Math.max(1, Math.ceil(words / 200)) });
    }, 300);
    return () => clearTimeout(timer);
  }, [version, activeId]);

  // The outline, after a pause. Only while it is open.
  useEffect(() => {
    if (!outlineOpen) return;
    const timer = setTimeout(() => {
      const doc = viewRef.current?.state.doc;
      setHeadings(doc && doc.length <= STATS_MAX_CHARS ? extractHeadings(doc.toString()) : []);
    }, 250);
    return () => clearTimeout(timer);
  }, [outlineOpen, version, activeId]);

  // Ask before the window closes with unsaved changes.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    getCurrentWindow()
      .onCloseRequested(async (event) => {
        const dirty = tabsRef.current.filter((t) => t.dirty);
        if (dirty.length === 0) return;
        const quit = await ask(`${dirty.length} file(s) have unsaved changes. Quit and lose the changes?`, {
          title: "oxide-text",
          kind: "warning",
          okLabel: "Quit",
          cancelLabel: "Cancel",
        });
        if (!quit) event.preventDefault();
      })
      .then((u) => (unlisten = u));
    return () => unlisten?.();
  }, []);

  // Dropping files on the window inserts links to them.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    getCurrentWebview()
      .onDragDropEvent(async (event) => {
        if (event.payload.type !== "drop") return;
        const tab = activeTab();
        const view = viewRef.current;
        if (!tab?.markdown || !view) return;
        if (!tab.path) {
          await message("Save the file first. A link to a dropped file is relative to the file.", { title: "oxide-text" });
          return;
        }
        insertAtSelection(view, linksForFiles(event.payload.paths, dirname(tab.path)));
        view.focus();
      })
      .then((u) => (unlisten = u));
    return () => unlisten?.();
  }, [activeTab]);

  // Show the file name and a dirty mark in the window title.
  const active = tabs.find((t) => t.id === activeId) ?? null;
  useEffect(() => {
    const title = active ? `${active.dirty ? "● " : ""}${active.title} — oxide-text` : "oxide-text";
    void getCurrentWindow().setTitle(title);
  }, [active?.title, active?.dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tabs,
    active,
    activeId,
    cursor,
    version,
    stats,
    outlineOpen,
    headings,
    scrollToId,
    printHtml,
    clearPrint: () => setPrintHtml(null),
    registry,
    actions,
    viewRef,
    activate,
    closeTab: closeTabById,
    cycleEol,
    openPaths,
    newFile,
    attach,
    getText,
    jumpToLine,
    jumpToAnchor,
    setViewMode,
    baseDir: active?.path ? dirname(active.path) : null,
  };
}
