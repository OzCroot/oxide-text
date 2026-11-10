import type { Eol } from "@/lib/api";
import type { CursorInfo, Tab } from "@/workspace";

const EOL_LABEL: Record<Eol, string> = { lf: "LF", crlf: "CRLF", cr: "CR" };

interface Props {
  tab: Tab | null;
  cursor: CursorInfo;
  onCycleEol(): void;
}

export function StatusBar({ tab, cursor, onCycleEol }: Props) {
  return (
    <div className="flex h-6 shrink-0 items-center gap-4 border-t border-border bg-muted px-3 text-xs text-muted-foreground">
      <span>
        Ln {cursor.line}, Col {cursor.col}
        {cursor.selections > 1 ? ` · ${cursor.selections} cursors` : ""}
        {cursor.selectedChars > 0 ? ` · ${cursor.selectedChars} selected` : ""}
      </span>
      <span className="ml-auto flex items-center gap-4">
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
          {tab?.plain ? "Plain Text" : "Markdown"}
        </span>
      </span>
    </div>
  );
}
