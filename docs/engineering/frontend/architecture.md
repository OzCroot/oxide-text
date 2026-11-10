# Frontend Architecture

## Overview

A React frontend in TypeScript, with shadcn/ui and Tailwind CSS,, in a Tauri webview. The project has no
frontend code yet. This file records the decided design. See
[ADR 0010](../../adr/0010-use-react-shadcn-tailwind.md) and
[the plan, section 2](../../../plan/OXIDE-TEXT-PLAN.md#2-architecture).

## Directory Structure

The planned layout of `ui/`:

```
ui/
├── shell/          # tab strip (pins, groups), panes, sidebar, status bar
├── launcher/       # the Ctrl+P overlay and its modes
├── editor/         # CodeMirror 6 setup
│   └── commands/   # one folder per editing feature (multicursor/, lines/, comment/, folding/)
├── markdown/       # view modes, preview, outline
├── tabs/           # tab, pin, and group logic
└── packages/       # the Packages view and the pack host
```

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
- Text buffers live in the CodeMirror state. The Rust core receives the text only on save and for session snapshots.
- Every user action is a command with a string id. The menu, keymap, launcher, and tab menus all dispatch through the command registry.
- The launcher renders results that the Rust core streams. It caps the list at 200 rows and virtualises it.
- The pack host loads only when a language pack is installed. It fetches pack files through the `oxpkg://` protocol.
- Markdown views: source, live, preview, split. Each tab has its own mode.

## Related

- [state.md](./state.md) — what state exists and who owns it
- [testing.md](./testing.md) — frontend tests
- [../standards/frontend.md](../standards/frontend.md) — frontend rules
