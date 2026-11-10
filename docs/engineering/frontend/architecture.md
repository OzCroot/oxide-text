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
├── components/          # TabStrip, StatusBar, and ui/ (shadcn/ui)
├── commands/            # the command registry, app commands, editor commands
├── keymap/              # key parsing, `when` clauses, the resolver, the default keymap
├── editor/              # CodeMirror extensions, and the large-block guard (large.ts)
└── lib/                 # `api.ts` (the Tauri calls), `utils.ts`
```

The plan adds `launcher/`, `markdown/` (view modes, preview, outline),
`tabs/` (pins and groups), and `packages/` (the pack host). None is built.

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
- A file with a block of more than 5,000 lines opens as plain text. The Markdown parser is too slow on such a block. See `src/ui/editor/large.ts`. The Rust core receives the text only on save and for session snapshots.
- Every user action is a command with a string id. The menu, keymap, launcher, and tab menus all dispatch through the command registry.
- The launcher renders results that the Rust core streams. It caps the list at 200 rows and virtualises it.
- The pack host loads only when a language pack is installed. It fetches pack files through the `oxpkg://` protocol.
- Markdown views: source, live, preview, split. Each tab has its own mode.

## Related

- [state.md](./state.md) — what state exists and who owns it
- [testing.md](./testing.md) — frontend tests
- [../standards/frontend.md](../standards/frontend.md) — frontend rules
