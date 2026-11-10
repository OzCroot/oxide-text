# Backend Architecture

## Overview

A Rust core in `src/tauri/`, inside a Tauri 2 shell. See
[ADR 0001](../../adr/0001-use-tauri-with-rust-core.md). The crates marked
"built" exist. The others are the plan.

## Crates

| Crate | Responsibility |
|-------|----------------|
| `ox-fs` (built) | Decode and encode text with the encoding, byte order mark, and line ending. Atomic write. The file watcher is not built. |
| `ox-index` | Workspace file list, frecency store, fuzzy matcher |
| `ox-search` | Full-text search, streaming |
| `ox-pkg` | Registry fetch, verify, install, enable and disable, lazy assets |
| `ox-session` | Hot exit: tabs, pins, groups, panes, unsaved buffer snapshots |
| `ox-settings` (built) | Parse JSONC, and merge settings layers |
| `ox-commands` | Command registry, keymap resolver. In M0 these are in the frontend (`src/ui/commands`, `src/ui/keymap`). |

## Libraries

The plan names these: `nucleo` (fuzzy matching), `ignore` and
`grep-searcher` (workspace walk and search), `notify` (file watching),
`encoding_rs` and `chardetng` (encoding), `comrak` and `ammonia` (Markdown
export), `trash` (delete to trash), minisign (signing).

## Protocols

- **Tauri commands** (`invoke`): the frontend calls the core. The app crate (`src/tauri/src/lib.rs`) has three: `open_file`, `save_file`, and `load_config`.
- **Capabilities:** `src/tauri/capabilities/default.json` lists what the webview may call. It allows the dialogs, and the window title and destroy calls.
- **Tauri `Channel`**: the core streams results to the frontend.
- **`oxpkg://`**: a custom protocol that serves installed pack files (`.wasm`, `.scm`, CSS) to the webview, with a strict content security policy. `wasm-unsafe-eval` is allowed. `unsafe-eval` is not.

## Logging, middleware, and DI

Not set.

## Related

- [testing.md](./testing.md) — backend tests
- [../standards/backend.md](../standards/backend.md) — backend rules
