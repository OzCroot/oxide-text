# Backend Coding Standards

This file records the rules that the code follows. The crates use the Rust
2021 edition. The project has no `clippy` or `rustfmt` configuration yet.

## Language & Framework

- **Tauri 2** with Rust. See [ADR 0001](../../adr/0001-use-tauri-with-rust-core.md).
- The core is a set of crates: `ox-fs`, `ox-index`, `ox-search`, `ox-pkg`, `ox-session`, `ox-settings`, `ox-commands`.

## Rules

- The Rust core handles I/O, indexing, search, packages, and sessions. It does not hold text buffers.
- The frontend calls the core with Tauri commands. Long results stream over a Tauri `Channel`.
- Write files atomically.
- Match fuzzy queries on a background pool.
- Start an external program directly, with no shell, and with a timeout.
- Take the setting for an external formatter only from the user settings file.
- Install a pack atomically: unpack to a temporary folder, then rename.
- Check the sha256 and the signature of a pack before you install it.

## Project Structure

```
src/tauri/
└── crates/
    ├── ox-fs/          # open and save, encoding, line endings (built). The watcher is not built.
    ├── ox-index/       # workspace file list, frecency, fuzzy matcher
    ├── ox-search/      # full-text search, streaming
    ├── ox-pkg/         # registry, verify, install, lazy assets
    ├── ox-session/     # hot exit: tabs, pins, groups, panes, unsaved buffers
    ├── ox-settings/    # layered JSONC settings (built)
    └── ox-commands/    # command registry, keymap resolver (M0: in the frontend)
```
