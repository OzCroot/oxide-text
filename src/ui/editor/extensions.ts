import { history } from "@codemirror/commands";
import { bracketMatching, foldGutter, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import { drawSelection, EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import type { Settings } from "@/settings";

// The base install styles Markdown only. Code in a fence stays plain until the
// user installs a language pack. Do not add `codeLanguages` here.
const markdownStyle = HighlightStyle.define([
  { tag: t.heading, color: "var(--syntax-heading)", fontWeight: "bold" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: [t.link, t.url], color: "var(--syntax-link)" },
  { tag: t.monospace, color: "var(--syntax-code)" },
  { tag: t.quote, color: "var(--syntax-quote)" },
  { tag: [t.processingInstruction, t.meta, t.contentSeparator], color: "var(--muted-foreground)" },
]);

function theme(settings: Settings): Extension {
  return EditorView.theme({
    "&": { height: "100%", color: "var(--foreground)", backgroundColor: "var(--background)" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", lineHeight: "1.6" },
    ".cm-content": { fontSize: `${settings.editor.fontSize}px`, padding: "12px 0", caretColor: "var(--foreground)" },
    ".cm-line": { padding: "0 16px" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
    ".cm-selectionBackground": { background: "var(--selection)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": { background: "var(--selection)" },
    ".cm-matchingBracket": { backgroundColor: "var(--accent)", outline: "1px solid var(--border)" },
    ".cm-gutters": { backgroundColor: "var(--background)", color: "var(--muted-foreground)", border: "none" },
    ".cm-foldGutter .cm-gutterElement": { cursor: "pointer", padding: "0 4px" },
  });
}

export interface EditorHooks {
  onDocChanged(): void;
  onSelectionChanged(view: EditorView): void;
  /** Return true if the paste was handled. */
  onPaste?(event: ClipboardEvent, view: EditorView): boolean;
}

/** The extensions for every editor state. No key is bound here: the command registry owns all keys. */
export function buildExtensions(settings: Settings, hooks: EditorHooks, withMarkdown = true): Extension[] {
  return [
    history(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    // Alt+Click adds a cursor.
    EditorView.clickAddsSelectionRange.of((e) => e.altKey),
    bracketMatching(),
    ...(withMarkdown
      ? [
          markdown({ base: markdownLanguage }),
          // Markdown has no line comments. Use HTML comments.
          markdownLanguage.data.of({ commentTokens: { block: { open: "<!--", close: "-->" } } }),
          syntaxHighlighting(markdownStyle),
          // Fold a section from its heading. The Markdown language knows the sections.
          foldGutter(),
        ]
      : []),
    theme(settings),
    settings.editor.wordWrap ? EditorView.lineWrapping : [],
    EditorView.domEventHandlers({ paste: (e, view) => hooks.onPaste?.(e, view) ?? false }),
    EditorView.updateListener.of((u) => {
      // view.setState (a tab switch) is an update with no transactions. It is not an edit.
      if (u.transactions.some((tr) => tr.docChanged)) hooks.onDocChanged();
      if (u.docChanged || u.selectionSet) hooks.onSelectionChanged(u.view);
    }),
  ];
}
