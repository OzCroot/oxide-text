# General Coding Standards

The project has no code yet. This file records the conventions the plan
decides. The team adds the rest in milestone M0, and updates this file then.

## Editor Config

The project has no `.editorconfig` yet. The team adds one in milestone M0.

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

The team sets file, variable, class, and constant naming for Rust and
TypeScript in milestone M0.

## Code Review

- Submit all changes through a pull request
- A merge needs at least one approval
