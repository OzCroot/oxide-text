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

- **Tauri commands** (`invoke`): the frontend calls the core. The app crate (`src/tauri/src/lib.rs`) has these: `open_file`, `save_file`, `check_paths`, `read_image`, `save_image`, and `load_config`. `check_paths` tells which paths exist (the preview marks broken links). `read_image` reads image files only. `save_image` takes raw bytes and saves `dir/<stem>-<n>.<ext>`, and refuses a name with a path in it.
- **Capabilities:** `src/tauri/capabilities/default.json` lists what the webview may call. It allows the dialogs, the window title and destroy calls, opening links with `opener:default`, and the window calls for the title bar (minimise, toggle maximise, close, is-maximised, start dragging).
- **Asset protocol:** the webview loads local images through `asset:` URLs. The scope starts empty. `open_file`, `save_file`, and `save_image` add the folder of the file. See [ADR 0012](../../adr/0012-preview-security-model.md).
- **Tauri `Channel`**: the core streams results to the frontend.
- **`oxpkg://`**: a custom protocol that serves installed pack files (`.wasm`, `.scm`, CSS) to the webview, with a strict content security policy. `wasm-unsafe-eval` is allowed. `unsafe-eval` is not.

## Logging, middleware, and DI

Not set.

## Related

- [testing.md](./testing.md) — backend tests
- [../standards/backend.md](../standards/backend.md) — backend rules
