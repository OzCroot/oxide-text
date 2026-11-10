import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { windowTitle } from "@/lib/title";

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

interface Props {
  /** The file name of the active tab, or null. */
  fileName: string | null;
  path: string | null;
  dirty: boolean;
}

function WindowButton({ label, onClick, danger, children }: { label: string; onClick(): void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        "flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
        danger ? "hover:bg-red-600 hover:text-white" : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The title bar. The app has no native one (`decorations: false`), so it looks the same on
 * every system. The bar is a drag area. A double click on it maximises the window.
 * Tauri handles the drag and the resize at the window edges.
 * On macOS the window keeps its own traffic-light buttons (`tauri.macos.conf.json`),
 * and this bar leaves room for them and draws none of its own.
 */
export function TitleBar({ fileName, path, dirty }: Props) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const win = getCurrentWindow();
    const refresh = () => void win.isMaximized().then(setMaximized).catch(() => {});
    refresh();
    let unlisten: (() => void) | undefined;
    void win.onResized(refresh).then((u) => (unlisten = u));
    return () => unlisten?.();
  }, []);

  const win = () => getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex h-8 shrink-0 items-center border-b border-border bg-muted text-xs select-none"
    >
      {IS_MAC ? <div data-tauri-drag-region className="w-20 shrink-0" /> : null}
      {/* The text must have the drag attribute too: Tauri only drags from an element that has it. */}
      <div
        data-tauri-drag-region
        title={path ?? undefined}
        className="flex min-w-0 flex-1 items-center justify-center gap-2 px-3 text-muted-foreground"
      >
        {dirty ? <span data-tauri-drag-region aria-label="Unsaved changes" className="size-2 shrink-0 rounded-full bg-foreground" /> : null}
        <span data-tauri-drag-region className="truncate">
          {windowTitle(fileName)}
        </span>
      </div>
      {IS_MAC ? (
        <div data-tauri-drag-region className="w-20 shrink-0" />
      ) : (
        <div className="flex h-full shrink-0">
          <WindowButton label="Minimise" onClick={() => void win().minimize()}>
            <Minus className="size-4" />
          </WindowButton>
          <WindowButton label={maximized ? "Restore" : "Maximise"} onClick={() => void win().toggleMaximize()}>
            {maximized ? <Copy className="size-3.5" /> : <Square className="size-3.5" />}
          </WindowButton>
          <WindowButton label="Close" danger onClick={() => void win().close()}>
            <X className="size-4" />
          </WindowButton>
        </div>
      )}
    </div>
  );
}
