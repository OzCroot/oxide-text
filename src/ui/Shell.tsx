import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useMemo, useRef } from "react";
import { StatusBar } from "@/components/StatusBar";
import { TabStrip } from "@/components/TabStrip";
import { defaultKeymap } from "@/keymap/default-keymap";
import { isModifierOnly, strokesFromEvent } from "@/keymap/keys";
import { Keymap, type Binding } from "@/keymap/resolver";
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

export function Shell({ settings, userKeybindings, theme, setTheme, onKeymapErrors }: Props) {
  const ws = useWorkspace(settings, setTheme, theme);
  const host = useRef<HTMLDivElement>(null);

  const keymap = useMemo(() => new Keymap([defaultKeymap, userKeybindings], IS_MAC), [userKeybindings]);
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

  return (
    <div className="flex h-full flex-col">
      <TabStrip
        tabs={ws.tabs}
        activeId={ws.activeId}
        onActivate={ws.activate}
        onClose={(id) => void ws.closeTab(id)}
        onNew={ws.newFile}
      />
      <div ref={host} className="min-h-0 flex-1 overflow-hidden" />
      <StatusBar tab={ws.active} cursor={ws.cursor} onCycleEol={ws.cycleEol} />
    </div>
  );
}
