# oxide-text

oxide-text is an open source text editor for Markdown documents. It supports many tabs, arranged in named groups. It also highlights a wide range of code syntaxes.

> **Status: early development.** Milestone M0 (the skeleton) is built. Most features below are still planned. The design is in [`plan/OXIDE-TEXT-PLAN.md`](plan/OXIDE-TEXT-PLAN.md). The features below describe the target, not the current state.

## Features

### Markdown first

- Four view modes for each tab: source, live, preview, and split.
- Full CommonMark and GitHub Flavored Markdown support. This includes tables, task lists, footnotes, and front matter.
- Editing commands for lists, tables, links, and headings.
- An outline panel that shows the heading tree.
- Export to HTML and PDF.

### Relative links

Markdown files link to each other and to assets with relative paths. oxide-text resolves each path against the folder of the file that contains it.

```markdown
See the [install guide](./docs/install.md#requirements).
Go up a level: [project overview](../overview.md).
![Architecture diagram](./assets/architecture.png)
```

- In preview mode, a click on a relative link opens the target file in a tab.
- A link with an anchor, such as `#requirements`, jumps to that heading.
- Relative images load from disk.
- A link to a file that does not exist is marked as broken.

### Multiple tabs and groups

- Open any number of documents in tabs.
- Split the window into panes. Each pane has its own tab strip.
- Put tabs in named, coloured groups. Collapse a group to save space.
- Pin the tabs that you need most.
- Restore all tabs, groups, and unsaved changes when you restart the editor.

### Many code syntaxes, off by default

The base install does not style code. Code files and fenced code blocks show as plain monospace text. This keeps the application light.

- Each language is a separate, optional package.
- A language package adds syntax highlighting and formatting for that language.
- Highlighting uses [tree-sitter](https://tree-sitter.github.io/) grammars.
- Fenced code blocks in Markdown use the same packages.
- Formatting runs in a sandbox. You can instead point a language at a formatter installed on your computer, such as `rustfmt` or `prettier`.
- Install a package when you first need it. No restart is necessary.
- Remove a package to free the space again.

### Keyboard shortcuts

The default keymap follows VS Code and Sublime Text.

| Shortcut | Action |
|---|---|
| `Ctrl+D` | Select the next occurrence of the selection |
| `Ctrl+Shift+L` | Select all occurrences of the selection |
| `Ctrl+L` | Select the line |
| `Ctrl+Alt+Up` / `Ctrl+Alt+Down` | Add a cursor above or below |
| `Alt+Up` / `Alt+Down` | Move the line up or down |
| `Shift+Alt+Up` / `Shift+Alt+Down` | Copy the line up or down |
| `Ctrl+Shift+K` | Delete the line |
| `Ctrl+/` | Toggle the comment |

Every shortcut is configurable. Each action has a command ID. Change the keymap in the settings file or in the keymap editor. Keymap presets, such as a Sublime Text set, are also optional packages.

### Fast navigation

A single launcher, opened with `Ctrl+P`, finds files, commands, headings, tabs, and text in the workspace.

## Technology

| Layer | Choice |
|---|---|
| Application shell | [Tauri 2](https://tauri.app/) (Rust) |
| User interface | TypeScript, React, shadcn/ui, Tailwind CSS, Vite |
| Editor | [CodeMirror 6](https://codemirror.net/) |
| Markdown | markdown-it, comrak |
| Syntax highlighting | web-tree-sitter |

See the [plan](plan/OXIDE-TEXT-PLAN.md) for the reasons behind each choice.

## Development

Prerequisites: Rust with the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/), Node.js 24, and pnpm 10.

```bash
cd src
pnpm install
pnpm tauri dev      # run the app
pnpm test           # frontend tests
cargo test --workspace --manifest-path tauri/Cargo.toml
```

All source and project files are in `src/`: `src/ui` for the React app, `src/tauri` for the Rust core, and `package.json` and the tool config. See [getting started](docs/operations/getting-started.md).

## Roadmap

| Milestone | Scope |
|---|---|
| M0 | Skeleton: open, save, basic tabs, settings |
| M1 | Markdown view modes and editing commands |
| M2 | Launcher |
| M3 | Pinned tabs, groups, panes, session restore |
| M4 | Language packages |
| M5 | Launcher: search and extra modes |
| M6 | Live mode, command line tool, updater |

## Documentation

All project documentation is in [`docs/`](docs/). Start with the [documentation guide](docs/documentation-guide.md).

## Contributing

The project is at an early stage. Open an issue to discuss an idea before you send a change.

## Licence

The licence is not yet chosen. See open question 8 in the [plan](plan/OXIDE-TEXT-PLAN.md#10-open-questions-please-decide).
