# General Coding Standards

The project has no code yet. This file records the conventions the plan
decides. The team adds the rest in milestone M0, and updates this file then.

## Editor Config

`.editorconfig` at the repository root sets: UTF-8, LF line endings, 2-space
indent (4 for Rust), 100 character lines, final newline, and trimmed
trailing whitespace. Markdown files keep trailing whitespace and have no
line limit.

## Git Conventions

- The main branch is `master`.
- Commit messages: imperative mood, concise subject line
- PRs target the `master` branch

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files (docs) | lowercase kebab-case | `architecture.md` |
| Rust crates | `ox-` prefix, kebab-case | `ox-session` |
| Command ids | dotted `area.action`, camelCase action | `selection.addNextOccurrence` |
| Setting keys | dotted lowercase, snake_case words | `tabs.pinned_compact` |
| Language settings | `languages.<id>.<key>` | `languages.rust.format` |
| Pack folders | `lang-<id>`, `keymap-<name>` | `packs/lang-rust/` |
| Pack ids | `kind.name` | `lang.rust` |
| Pack archives | `.oxpkg` | — |
| Launcher mode prefixes | one character, set in the plan | `>`, `@`, `:` |

| Context | Convention | Example |
|---------|-----------|---------|
| TypeScript files | kebab-case for modules, PascalCase for React components | `default-keymap.ts`, `TabStrip.tsx` |
| TypeScript variables | camelCase | `activeId` |
| TypeScript types | PascalCase | `CommandContext` |
| TypeScript constants | UPPER_SNAKE_CASE | `MAX_BLOCK_LINES` |
| Rust | the standard Rust style: snake_case functions, PascalCase types | `save_file`, `Decoded` |

The project has no linter yet, so no tool checks these rules.

## Code Review

- Submit all changes through a pull request
- A merge needs at least one approval
