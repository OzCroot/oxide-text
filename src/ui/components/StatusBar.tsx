import type { Eol } from "@/lib/api";
import type { ViewMode } from "@/settings";
import type { CursorInfo, DocStats, Tab } from "@/workspace";

const EOL_LABEL: Record<Eol, string> = { lf: "LF", crlf: "CRLF", cr: "CR" };

interface Props {
  tab: Tab | null;
  cursor: CursorInfo;
  stats: DocStats | null;
  onCycleEol(): void;
  onSetMode(mode: ViewMode): void;
  onToggleOutline(): void;
  outlineOpen: boolean;
}

const MODES: { mode: ViewMode; label: string }[] = [
  { mode: "source", label: "Source" },
  { mode: "split", label: "Split" },
  { mode: "preview", label: "Preview" },
];

export function StatusBar({ tab, cursor, stats, onCycleEol, onSetMode, onToggleOutline, outlineOpen }: Props) {
  return (
    <div className="flex h-6 shrink-0 items-center gap-4 border-t border-border bg-muted px-3 text-xs text-muted-foreground">
      <span>
        Ln {cursor.line}, Col {cursor.col}
        {cursor.selections > 1 ? ` · ${cursor.selections} cursors` : ""}
        {cursor.selectedChars > 0 ? ` · ${cursor.selectedChars} chars, ${cursor.selectedWords} words selected` : ""}
      </span>
      {stats ? (
        <span title={`${stats.chars.toLocaleString()} characters`}>
          {stats.words.toLocaleString()} {stats.words === 1 ? "word" : "words"} · {stats.minutes} min read
        </span>
      ) : null}
      <span className="ml-auto flex items-center gap-4">
        {tab?.markdown ? (
          <>
            <button
              type="button"
              aria-pressed={outlineOpen}
              onClick={onToggleOutline}
              className={outlineOpen ? "text-foreground" : "hover:text-foreground"}
              title="Show the outline of headings"
            >
              Outline
            </button>
            <span role="group" aria-label="View mode" className="flex gap-2">
              {MODES.map((m) => (
                <button
                  key={m.mode}
                  type="button"
                  aria-pressed={tab.mode === m.mode}
                  onClick={() => onSetMode(m.mode)}
                  className={tab.mode === m.mode ? "font-medium text-foreground" : "hover:text-foreground"}
                >
                  {m.label}
                </button>
              ))}
            </span>
          </>
        ) : null}
        {tab ? (
          <>
            <button
              type="button"
              className="hover:text-foreground"
              onClick={onCycleEol}
              title={tab.mixedEol ? "Mixed line endings. Saving makes them the same. Click to change." : "Click to change the line ending"}
            >
              {EOL_LABEL[tab.eol]}
              {tab.mixedEol ? " (mixed)" : ""}
            </button>
            <span title="Encoding">
              {tab.encoding}
              {tab.bom ? " with BOM" : ""}
            </span>
          </>
        ) : null}
        <span title={tab?.plain ? "This file has a block too long for the Markdown parser, so it opens as plain text." : undefined}>
          {tab && (!tab.markdown || tab.plain) ? "Plain Text" : "Markdown"}
        </span>
      </span>
    </div>
  );
}
