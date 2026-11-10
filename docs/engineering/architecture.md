# Architecture

oxide-text — an open source text editor for Markdown documents, with
multi-tab, multi-group editing and optional language packs.

The project has no code yet. This file records the decided design. The
full design is in [the plan](../../plan/OXIDE-TEXT-PLAN.md). Each choice has
an [ADR](../adr/). Several ADRs are still `proposed`.

## Tech Stack

| Layer | Technology | Version | Decision |
|-------|-----------|---------|----------|
| Application shell | Tauri | 2 | [ADR 0001](../adr/0001-use-tauri-with-rust-core.md) |
| Core language | Rust | not set | [ADR 0001](../adr/0001-use-tauri-with-rust-core.md) |
| Frontend language | TypeScript | not set | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Frontend framework | React | not set | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| UI components | shadcn/ui | not set | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Styles | Tailwind CSS | not set | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Bundler | Vite | not set | [ADR 0010](../adr/0010-use-react-shadcn-tailwind.md) |
| Editor | CodeMirror | 6 | [ADR 0003](../adr/0003-use-codemirror-6-as-the-editor.md) |
| Code highlighting | web-tree-sitter, in packs | not set | [ADR 0004](../adr/0004-language-packs-with-tree-sitter.md) |
| Code formatting | WASM in packs, or an external tool | — | [ADR 0005](../adr/0005-formatters-wasm-with-external-option.md) |
| Markdown preview | markdown-it, DOMPurify | not set | [ADR 0006](../adr/0006-markdown-rendering-stack.md) |
| Markdown export | comrak, ammonia (Rust) | not set | [ADR 0006](../adr/0006-markdown-rendering-stack.md) |
| Fuzzy matching | nucleo (Rust) | not set | the plan, section 1 |
| Workspace search | `ignore` and `grep-searcher` crates | not set | the plan, section 1 |
| File watching | `notify` crate | not set | the plan, section 1 |
| Encoding | `encoding_rs`, `chardetng` | not set | the plan, section 1 |
| Package signing | minisign (ed25519) | — | [ADR 0007](../adr/0007-signed-static-package-registry.md) |
| Database | None | — | — |
| CMS | None | — | — |

The team sets exact versions when it creates `package.json` and `Cargo.toml`.
The package manager is not chosen.

## Build Commands

The project has no build scripts yet. The team defines them in milestone M0.
Tauri provides the `dev` and `build` commands for the shell.

## Architecture Summary

- **Frontend**: a React app in `ui/`. It holds the tab strip, panes, launcher, editor, and preview. Text buffers live here, in the CodeMirror state.
- **Backend**: a Rust core in `src-tauri/`, split into crates: `ox-fs`, `ox-index`, `ox-search`, `ox-pkg`, `ox-session`, `ox-settings`, `ox-commands`.
- **Commands**: every user action is a command with a string id. The menu, keymap, launcher, and tab menus all use the same registry. See [ADR 0009](../adr/0009-command-registry-and-configurable-keymap.md).
- **Packs**: a pack host loads only when a language pack is installed. The host serves pack files through the custom `oxpkg://` protocol.
- **Standards**: coding conventions for all teams. See [./standards/](./standards/)

## Code Style

The team has not set a linter or a formatter. The language rules for
documents are in [standards/language.md](./standards/language.md).
