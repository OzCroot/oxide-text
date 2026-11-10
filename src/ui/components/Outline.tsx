import type { Heading } from "@/markdown/headings";
import { cn } from "@/lib/utils";

interface Props {
  headings: Heading[];
  /** The line of the cursor. The heading above it is shown as current. */
  cursorLine: number;
  onJump(line: number): void;
}

export function Outline({ headings, cursorLine, onJump }: Props) {
  let current = -1;
  headings.forEach((h, i) => {
    if (h.line <= cursorLine) current = i;
  });
  const minLevel = headings.reduce((m, h) => Math.min(m, h.level), 6);

  return (
    <nav aria-label="Outline" className="w-60 shrink-0 overflow-auto border-r border-border bg-muted py-2 text-sm">
      <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Outline</div>
      {headings.length === 0 ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">No headings</p>
      ) : (
        <ul>
          {headings.map((h, i) => (
            <li key={`${h.line}-${i}`}>
              <button
                type="button"
                onClick={() => onJump(h.line)}
                title={`Line ${h.line}`}
                style={{ paddingLeft: `${12 + (h.level - minLevel) * 14}px` }}
                className={cn(
                  "block w-full truncate py-0.5 pr-3 text-left hover:bg-accent",
                  i === current && "bg-accent font-medium",
                )}
              >
                {h.text || <span className="text-muted-foreground">(empty)</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
