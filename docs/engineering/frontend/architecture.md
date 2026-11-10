# Frontend Architecture

## Overview

A React frontend in TypeScript, with shadcn/ui and Tailwind CSS, in a Tauri
webview. Milestone M0 built the parts marked "built". The rest is the plan.
See
[ADR 0010](../../adr/0010-use-react-shadcn-tailwind.md) and
[the plan, section 2](../../../plan/OXIDE-TEXT-PLAN.md#2-architecture).

## Directory Structure

The layout of `src/ui/` in M0:

```
src/ui/
├── main.tsx, App.tsx    # startup, config load, theme, error banner
├── Shell.tsx            # creates the editor view, routes every key to the keymap
├── workspace.ts         # tabs, the active editor state, open, save, close
├── settings.ts          # settings types, checks, theme resolution
├── menus.ts             # the menu bar content, written by hand
├── components/          # TitleBar, MenuBar, TabStrip, StatusBar, Preview, Outline, and ui/ (shadcn/ui)
├── commands/            # the command registry, app, editor, and Markdown commands
├── keymap/              # key parsing, `when` clauses, the resolver, the default keymap
├── editor/              # CodeMirror extensions, the large-block guard, paste handling
│   └── commands/        # one folder per feature: format/, headings/, lists/, blocks/, tables/
├── markdown/            # render, sanitize, headings, links, paths, scroll sync, export
└── lib/                 # `api.ts` (the Tauri calls), `utils.ts`
```

The plan adds `launcher/`, `tabs/` (pins and groups), and `packages/` (the
pack host). None is built. The Live view mode (M6) is not built.

## Data Flow

```
UI (React)  ── invoke() commands ──▶ Rust core
UI (React)  ◀── Channel<T> streams ── Rust core   (launcher results, search)

Editor (CodeMirror 6)
  ├─ Markdown mode, built in: source, live, preview, split
  └─ pack host, only if a pack is installed: highlight and format
Preview: markdown-it, DOMPurify, scroll sync through data-line attributes
```

## Rules

- Mount CodeMirror 6 as a plain view in a component. Do not copy the buffer into React state.
- One `EditorView` shows the active tab. Each tab keeps its own `EditorState`, so its text, undo history, and selection stay with it. `workspace.ts` swaps the state on a tab change.
- Text buffers live in the CodeMirror state.
- `Shell.tsx` listens for `keydown` on the window, and the keymap resolver maps each key to a command id. The editor has no key map of its own.
- **Title bar:** the app draws its own (`TitleBar.tsx`), with the file name, the unsaved dot, and the window buttons. The window has no native decorations. See [ADR 0013](../../adr/0013-custom-title-bar.md).
- **Menu bar:** a hamburger button at the start of the tab strip shows or hides the menu bar under the title bar (command `view.toggleMenuBar`). The state is kept in the webview's local storage, and the bar starts hidden. The bar slides open and fades in (150 ms, a grid-row transition). It clips its content only while it moves, so a dropdown is never cut off. With `prefers-reduced-motion`, it shows at once. The ten menus (File, Edit, Selection, Find, View, Goto, Tools, Project, Preferences, Help) are written by hand in `menus.ts`. An item names a command id. The label comes from the command, and the key hint comes from the keymap. Find, Tools, Project, Preferences, and Help are empty and show "No items yet". `menus.test.ts` checks that every item names a command that exists.
- **View modes (M1):** each Markdown tab is in source, split, or preview mode. The editor stays mounted and is hidden in preview mode. Only Markdown files (`.md`, `.markdown`, and new files) get Markdown styling. Any other file opens as plain text.
- **Preview pipeline:** `renderMarkdown` (markdown-it, adds `data-line` and heading ids) then `sanitizeHtml` (DOMPurify with extra rules). The webview never gets HTML that skipped the sanitizer. See [ADR 0012](../../adr/0012-preview-security-model.md).
- **Links:** `classifyHref` decides what a click does. An anchor scrolls. A web link opens in the system browser. A relative path opens the file in a tab, resolved from the folder of the document. The webview never navigates. A link to a missing file or heading is marked in the preview.
- **Scroll sync:** in split mode, the editor and the preview follow each other. The preview marks each block with its source line, and `scroll-sync.ts` interpolates between the blocks.
- **Paste and drop:** a pasted image is saved next to the file and linked. Pasted HTML becomes Markdown, unless it is only styled text from a code editor. A dropped file becomes a link relative to the document.
- **Format on save:** tables are padded when the file saves (setting `markdown.formatTablesOnSave`).
- A file with a block of more than 5,000 lines opens as plain text. The Markdown parser is too slow on such a block. See `src/ui/editor/large.ts`. The Rust core receives the text only on save and for session snapshots.
- Every user action is a command with a string id. The menu, keymap, launcher, and tab menus all dispatch through the command registry.
- The launcher renders results that the Rust core streams. It caps the list at 200 rows and virtualises it.
- The pack host loads only when a language pack is installed. It fetches pack files through the `oxpkg://` protocol.
- Markdown views: source, live, preview, split. Each tab has its own mode.

## Related

- [state.md](./state.md) — what state exists and who owns it
- [testing.md](./testing.md) — frontend tests
- [../standards/frontend.md](../standards/frontend.md) — frontend rules
