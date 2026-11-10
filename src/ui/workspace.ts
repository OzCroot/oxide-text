import { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { ask, message, open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRegistry, type AppActions, type CommandRegistry } from "@/commands";
import { buildExtensions, type EditorHooks } from "@/editor/extensions";
import { canParseMarkdown } from "@/editor/large";
import { openFile, saveFile, type Eol } from "@/lib/api";
import type { Settings, ThemeSetting } from "@/settings";

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
  /** True if the text is plain: the file has a block too long for the Markdown parser. */
  plain: boolean;
}

export interface CursorInfo {
  line: number;
  col: number;
  selections: number;
  selectedChars: number;
}

const EOL_CYCLE: Eol[] = ["lf", "crlf", "cr"];
let nextId = 1;

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
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
  const [cursor, setCursor] = useState<CursorInfo>({ line: 1, col: 1, selections: 1, selectedChars: 0 });

  const viewRef = useRef<EditorView | null>(null);
  const states = useRef(new Map<string, EditorState>());
  const tabsRef = useRef<Tab[]>([]);
  const activeRef = useRef<string | null>(null);
  tabsRef.current = tabs;
  activeRef.current = activeId;

  const hooks = useMemo<EditorHooks>(
    () => ({
        onDocChanged: () => {
          const id = activeRef.current;
          if (!id) return;
          setTabs((ts) => ts.map((t) => (t.id === id && !t.dirty ? { ...t, dirty: true } : t)));
        },
        onSelectionChanged: (view) => {
          const sel = view.state.selection;
          const head = sel.main.head;
          const line = view.state.doc.lineAt(head);
          let chars = 0;
          for (const r of sel.ranges) chars += r.to - r.from;
          setCursor({ line: line.number, col: head - line.from + 1, selections: sel.ranges.length, selectedChars: chars });
        },
      }),
    [],
  );

  /** A new editor state. A file with a very long block opens as plain text. */
  const newState = useCallback(
    (text: string) => {
      const markdown = canParseMarkdown(text);
      return { state: EditorState.create({ doc: text, extensions: buildExtensions(settings, hooks, markdown) }), plain: !markdown };
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
    view.focus();
    const head = next.selection.main.head;
    const line = next.doc.lineAt(head);
    setCursor({ line: line.number, col: head - line.from + 1, selections: next.selection.ranges.length, selectedChars: 0 });
  }, []);

  const addTab = useCallback(
    (tab: Omit<Tab, "id" | "dirty" | "plain">, text: string) => {
      const id = `tab-${nextId++}`;
      const { state, plain } = newState(text);
      states.current.set(id, state);
      const full: Tab = { ...tab, id, dirty: false, plain };
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

  const newFile = useCallback(() => {
    addTab(
      { path: null, title: "Untitled", encoding: "UTF-8", bom: false, eol: settings.files.defaultEol, mixedEol: false },
      "",
    );
  }, [addTab, settings.files.defaultEol]);

  const openPaths = useCallback(
    async (paths: string[]) => {
      for (const path of paths) {
        const existing = tabsRef.current.find((t) => t.path === path);
        if (existing) {
          activate(existing.id);
          continue;
        }
        try {
          const f = await openFile(path);
          addTab(
            { path, title: baseName(path), encoding: f.encoding, bom: f.bom, eol: f.eol, mixedEol: f.mixed_eol },
            f.text,
          );
        } catch (e) {
          await message(`Cannot open ${path}\n\n${String(e)}`, { title: "oxide-text", kind: "error" });
        }
      }
    },
    [activate, addTab],
  );

  const openFiles = useCallback(async () => {
    const picked = await open({ multiple: true, directory: false });
    if (!picked) return;
    await openPaths(Array.isArray(picked) ? picked : [picked]);
  }, [openPaths]);

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
      await saveFile({ path, text: textOf(id), encoding: tab.encoding, bom: tab.bom, eol: tab.eol });
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
  }, [textOf]);

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
    }),
    [newFile, openFiles, saveTab, closeTabById, cycleTab, setTheme, currentTheme],
  );

  const registry: CommandRegistry = useMemo(() => createRegistry(), []);

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
    registry,
    actions,
    viewRef,
    activate,
    closeTab: closeTabById,
    cycleEol,
    openPaths,
    newFile,
    attach,
  };
}
