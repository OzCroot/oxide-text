import { Menu, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tab } from "@/workspace";

interface Props {
  tabs: Tab[];
  activeId: string | null;
  onActivate(id: string): void;
  onClose(id: string): void;
  onNew(): void;
  menuBarOpen: boolean;
  onToggleMenuBar(): void;
}

export function TabStrip({ tabs, activeId, onActivate, onClose, onNew, menuBarOpen, onToggleMenuBar }: Props) {
  return (
    <div role="tablist" className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-border bg-muted">
      <Button
        variant="ghost"
        size="icon"
        aria-label={menuBarOpen ? "Hide the menu bar" : "Show the menu bar"}
        aria-pressed={menuBarOpen}
        title={menuBarOpen ? "Hide the menu bar" : "Show the menu bar"}
        onClick={onToggleMenuBar}
        className="mx-1.5 my-1.5 shrink-0"
      >
        <Menu className="size-4" />
      </Button>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tab"
          aria-selected={t.id === activeId}
          title={t.path ?? t.title}
          onClick={() => onActivate(t.id)}
          onAuxClick={(e) => {
            if (e.button === 1) onClose(t.id);
          }}
          className={cn(
            "group flex max-w-56 min-w-24 cursor-default items-center gap-2 border-r border-border px-3 text-sm select-none",
            t.id === activeId ? "bg-background text-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          <span className="truncate">{t.title}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Close ${t.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose(t.id);
            }}
            className="ml-auto"
          >
            {t.dirty ? <span className="size-2 rounded-full bg-foreground group-hover:hidden" /> : null}
            <X className={cn("size-3.5", t.dirty && "hidden group-hover:block")} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="icon" aria-label="New file" onClick={onNew} className="m-1.5 shrink-0">
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
