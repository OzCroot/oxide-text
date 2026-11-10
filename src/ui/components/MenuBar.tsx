import { useEffect, useRef, useState } from "react";
import type { CommandRegistry } from "@/commands";
import { formatKey } from "@/keymap/format";
import type { Keymap } from "@/keymap/resolver";
import { cn } from "@/lib/utils";
import { menus, type Menu, type MenuItem } from "@/menus";

const ANIMATION_MS = 150;

interface Props {
  /** Show or hide the bar. It slides and fades. */
  open: boolean;
  registry: CommandRegistry;
  keymap: Keymap;
  isMac: boolean;
  /** Run a command by id. */
  onRun(commandId: string): void;
  /** Called after a menu closes, to give the focus back to the editor. */
  onClosed(): void;
}

interface Row {
  command: string;
  label: string;
  keys: string | null;
}

function rowsOf(menu: Menu, registry: CommandRegistry, keymap: Keymap, isMac: boolean): (Row | "separator")[] {
  return menu.items.map((i: MenuItem) => {
    if ("separator" in i) return "separator";
    const key = keymap.keysFor(i.command)[0];
    return {
      command: i.command,
      label: i.label ?? registry.get(i.command)?.title ?? i.command,
      keys: key ? formatKey(key, isMac) : null,
    };
  });
}

/**
 * The menu bar. The menus are in `menus.ts`. A click opens a menu. When one is open,
 * moving over another menu opens that one. Esc, a click outside, or choosing an item closes it.
 * Left and Right move between menus. Up and Down move between items. Enter runs the item.
 */
export function MenuBar({ open: shown, registry, keymap, isMac, onRun, onClosed }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  // While the bar moves, it clips its content. A dropdown hangs below the bar, so
  // the clip must be off when the bar is at rest.
  const [settled, setSettled] = useState(shown);
  const previous = useRef(shown);

  useEffect(() => {
    if (previous.current === shown) return;
    previous.current = shown;
    if (!shown) setOpenId(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSettled(false);
    const timer = setTimeout(() => setSettled(shown), reduce ? 0 : ANIMATION_MS + 20);
    return () => clearTimeout(timer);
  }, [shown]);

  const open = openId ? (menus.find((m) => m.id === openId) ?? null) : null;
  const rows = open ? rowsOf(open, registry, keymap, isMac) : [];
  const runnable = rows.map((r, i) => (r === "separator" ? -1 : i)).filter((i) => i >= 0);

  const close = () => {
    setOpenId(null);
    onClosed();
  };

  // Close on a click outside the bar.
  useEffect(() => {
    if (!openId) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpenId(null);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [openId]);

  const openMenu = (id: string) => {
    setOpenId(id);
    const m = menus.find((x) => x.id === id);
    const first = m?.items.findIndex((i) => "command" in i) ?? -1;
    setActive(first);
  };

  const move = (step: 1 | -1) => {
    if (runnable.length === 0) return;
    const at = runnable.indexOf(active);
    setActive(runnable[(at + step + runnable.length) % runnable.length]!);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!openId) return;
    const idx = menus.findIndex((m) => m.id === openId);
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        openMenu(menus[(idx + 1) % menus.length]!.id);
        break;
      case "ArrowLeft":
        e.preventDefault();
        openMenu(menus[(idx - 1 + menus.length) % menus.length]!.id);
        break;
      case "Enter":
      case " ": {
        const row = rows[active];
        if (row && row !== "separator") {
          e.preventDefault();
          onRun(row.command);
          close();
        }
        break;
      }
    }
  };

  return (
    <div
      // The row grows from 0 to its height. This animates the height of content of unknown size.
      className={cn(
        "grid shrink-0 transition-[grid-template-rows,opacity] ease-out motion-reduce:transition-none",
        shown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      style={{ transitionDuration: `${ANIMATION_MS}ms` }}
      // A hidden bar must not take the focus.
      inert={!shown}
      aria-hidden={!shown}
    >
      <div className={cn("min-h-0", shown && settled ? "overflow-visible" : "overflow-hidden")}>
        <div
          ref={root}
          role="menubar"
          aria-label="Menu bar"
          onKeyDown={onKeyDown}
          className="relative flex h-7 shrink-0 items-center gap-0.5 border-b border-border bg-muted px-1 text-xs select-none"
        >
          {menus.map((m) => (
            <div key={m.id} className="relative h-full">
              <button
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={openId === m.id}
                onClick={() => (openId === m.id ? close() : openMenu(m.id))}
                // With a menu open, moving over another menu opens it, as in a desktop menu bar.
                onPointerEnter={() => openId && openId !== m.id && openMenu(m.id)}
                className={cn("h-full rounded px-2.5 hover:bg-accent", openId === m.id && "bg-accent")}
              >
                {m.label}
              </button>
              {openId === m.id ? (
                <div
                  role="menu"
                  aria-label={m.label}
                  className="absolute top-full left-0 z-50 min-w-60 rounded-md border border-border bg-background py-1 shadow-lg"
                >
                  {rows.length === 0 ? (
                    <div className="px-3 py-1.5 text-muted-foreground">No items yet</div>
                  ) : (
                    rows.map((r, i) =>
                      r === "separator" ? (
                        <div key={i} role="separator" className="my-1 border-t border-border" />
                      ) : (
                        <button
                          key={i}
                          type="button"
                          role="menuitem"
                          onPointerEnter={() => setActive(i)}
                          onClick={() => {
                            onRun(r.command);
                            close();
                          }}
                          className={cn("flex w-full items-center justify-between gap-8 px-3 py-1.5 text-left", i === active && "bg-accent")}
                        >
                          <span>{r.label}</span>
                          {r.keys ? <span className="text-muted-foreground">{r.keys}</span> : null}
                        </button>
                      ),
                    )
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
