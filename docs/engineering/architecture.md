# Architecture

oxide-text — an open source text editor for Markdown documents, with
multi-tab, multi-group editing and optional language packs.

Milestone M0 (the skeleton) is built. The full design is in
[the plan](../../plan/OXIDE-TEXT-PLAN.md). Each choice has an
[ADR](../adr/). Versions are from `package.json`, `pnpm-lock.yaml`, and
`Cargo.lock`.

## Tech Stack

| Layer | Technology | Version | Decision |
|-------|-----------|---------|----------|
| Application shell | Tauri | 2.12 | [ADR 0001](../adr/0001-use-tauri-with-rust-core.md) |
| Core language | Rust | 2021 edition (built with 1.99) | [ADR 0001](../adr/0001-use-tauri-with-rust-core.md) |
| Frontend language | TypeScript | 7.0 | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Frontend framework | React | 19.3 | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| UI components | shadcn/ui (Radix Slot, class-variance-authority) | copied into the repo | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Styles | Tailwind CSS | 4.3 | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Bundler | Vite | 8.3 | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Package manager | pnpm | 10.33 | [ADR 0011](../adr/0011-use-pnpm-package-manager.md) |
| Editor | CodeMirror | 6 (`@codemirror/view` 6.43) | [ADR 0003](../adr/0003-use-codemirror-6-as-the-editor.md) |
| Unit tests | Vitest | 5.1 | [frontend/testing.md](./frontend/testing.md) |
| Encoding | `encoding_rs` 0.8, `chardetng` 0.1 | — | the plan, section 1 |
| JSONC settings | `jsonc-parser` 0.26 | — | the plan, section 1 |
| Code highlighting | web-tree-sitter, in packs | not built | [ADR 0004](../adr/0004-language-packs-with-tree-sitter.md) |
| Code formatting | WASM in packs, or an external tool | not built | [ADR 0005](../adr/0005-formatters-wasm-with-external-option.md) |
| Markdown preview | markdown-it 15 (with footnote and task-list plugins), DOMPurify 3.4 | built in M1 | [ADR 0006](../adr/0006-markdown-rendering-stack.md), [ADR 0012](../adr/0012-preview-security-model.md) |
| Paste HTML as Markdown | turndown 7 (with its GFM plugin) | built in M1 | the plan, section 3.3 |
| Open links in the browser | `tauri-plugin-opener` | 2 | [ADR 0012](../adr/0012-preview-security-model.md) |
| DOM for tests | jsdom | 31 (dev only) | [frontend/testing.md](./frontend/testing.md) |
| Markdown export | comrak, ammonia (Rust) | not built | [ADR 0006](../adr/0006-markdown-rendering-stack.md) |
| Fuzzy matching | nucleo (Rust) | not built | the plan, section 1 |
| Workspace search | `ignore` and `grep-searcher` crates | not built | the plan, section 1 |
| File watching | `notify` crate | not built | the plan, section 1 |
| Package signing | minisign (ed25519) | not built | [ADR 0007](../adr/0007-signed-static-package-registry.md) |
| Database | None | — | — |
| CMS | None | — | — |

## Build Commands

Run these from the `src/` folder. `package.json`, the lockfile, and the Vite and TypeScript config are there.

```bash
cd src
pnpm install                 # Install the frontend dependencies
pnpm tauri dev               # Run the app with hot reload
pnpm tauri build             # Build the installer
pnpm typecheck               # Check the TypeScript types
pnpm test                    # Run the Vitest tests
pnpm check:installer         # Fail if an installer is over 10 MiB
cargo test --workspace --manifest-path tauri/Cargo.toml   # Run the Rust tests
```

`pnpm dev` starts only the Vite server. The editor needs the Tauri shell for
file access, so use `pnpm tauri dev`.

## Architecture Summary

- **Frontend**: a React app in `src/ui/`. It holds the tab strip, panes, launcher, editor, and preview. Text buffers live here, in the CodeMirror state.
- **Backend**: a Rust core in `src/tauri/`. The crates `ox-fs` and `ox-settings` exist. The plan adds `ox-index`, `ox-search`, `ox-pkg`, `ox-session`, and `ox-commands`.
- **Commands**: every user action is a command with a string id. The menu, keymap, launcher, and tab menus all use the same registry. See [ADR 0009](../adr/0009-command-registry-and-configurable-keymap.md).
- **Packs**: a pack host loads only when a language pack is installed. The host serves pack files through the custom `oxpkg://` protocol.
- **Standards**: coding conventions for all teams. See [./standards/](./standards/)

## Code Style

`.editorconfig` sets the base style. The team has not set a linter or a
formatter. The language rules for documents are in
[standards/language.md](./standards/language.md).
