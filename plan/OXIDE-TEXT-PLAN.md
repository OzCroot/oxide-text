# oxide-text — Rebuild Plan (Tauri)

Status: planning only. No code. Revision 2, 2026-11-10.

oxide-text is an original, cross-platform editor focused on **Markdown viewing and editing**. The base install does **not style code**: code files and fenced code blocks show as plain monospace text. Each language is an **optional add-on package** that adds syntax highlighting and formatting, so the base install stays small. It has four headline features:

1. A **Ctrl+P launcher** that works as a full app: files, commands, symbols, search, tabs, packages, actions.
2. **Pinned tabs and named tab groups.**
3. **Language packs, off by default and installed on demand.** Each pack adds highlighting and formatting.
4. **VS Code and Sublime Text style editing shortcuts** (Ctrl+D, Ctrl+Shift+L, move line, and so on), all configurable (§7.1).

The reference application was analysed for *behaviour and architecture only*. No names, themes, icons, file formats, keymaps or code are copied.

---

## 0. What the reference does (evidence)

Evidence ids are in the Craft Anything investigation ledger. Each line is marked as **observed** (seen directly in the target), **derived** (worked out from what was seen) or **inferred** (best guess).

| # | Fact | Basis | Evidence |
|---|------|-------|----------|
| F1 | Native x64 C++ with OpenGL rendering. Plugins run out of process in bundled Python hosts (two Python versions). | observed | ev_0f0348eb…, ev_bb3433c0…, ev_1873d3ad… |
| F2 | Every language is a separate zip package (54 of them, 13 KB–1.6 MB each). Grammars are declarative YAML with inheritance (`extends`) and a compiled on-disk cache. **All 54 are bundled in the base install.** | observed | ev_9fc1923b…, ev_c6c80854… |
| F3 | Ctrl+P is one overlay with pluggable handlers: file, symbol, project symbol, line and word. It has a live file preview while you move through results, respects .gitignore, and filters fuzzily in parallel. The command palette and quick panel are separate overlays, and their results carry kind badges. | derived | ev_1873d3ad…, ev_a6ef16e2…, ev_1e1bd350… |
| F4 | Each tab holds a "sheet" of some kind: text, image, HTML or VCS. Sheets sit in layout groups (panes). The reference supports transient preview tabs, selecting several tabs at once, and dragging tabs. Hot-exit restores the session, including unsaved buffers. | derived | ev_48b751ba…, ev_0f1d4daf…, ev_fb7bce36… |
| U1 | Whether the reference can pin tabs is unknown. Only a bare `pinned_` string was found. This doesn't matter, because pinning is a new feature here either way. | unknown | ev_703580cd… |

Earlier output in this folder: the five egui-based docs (README, PLAN, SHORTCUTS, ARCHITECTURE, ROADMAP) and draft Rust sources are **no longer in `plan/app/`**, which is empty (ev_1bd406c7…). This document replaces them, and switches the stack to Tauri.

What we keep from the reference: the modular language packages (F2) and the single fuzzy overlay with handlers and live preview (F3). Preview tabs and session restore (F4) carry over too.

What we change: language packs are **not bundled** but installed on demand, and **code styling stays off until a pack is installed**. The palette and Ctrl+P are **merged** into one launcher with modes. Tab **pinning and named groups** are added on top of panes.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Shell | **Tauri 2** | Uses the system webview, so the installer is about 5–10 MB instead of Electron's 80+ MB. Rust backend. v2 capability permissions. Built-in updater. |
| Frontend | **TypeScript + React + Vite**, with **shadcn/ui** components and **Tailwind CSS** | Largest ecosystem. shadcn/ui gives accessible components that live in the repository. CodeMirror stays outside React state. See ADR 0010. |
| Editor | **CodeMirror 6** | Proven Markdown support (Lezer markdown + GFM). Decoration API for the live-preview mode. Multi-cursor, folding, search, IME, accessibility. Handles files of 10 MB or more. |
| Markdown render | **markdown-it** (frontend) + **DOMPurify** | Fast incremental re-render for the preview. The plugin system maps onto add-on packages. |
| Markdown export | **comrak** (Rust, GFM) + **ammonia** | Same output headless, for HTML export or CLI use. |
| Language highlighting | **web-tree-sitter** (WASM in webview) + `.scm` queries | Packs are **data only** (a `.wasm` grammar plus queries): no arbitrary JS, sandboxed by WASM, incremental parsing. Large grammar ecosystem, mostly MIT. Loaded only when a pack is installed. |
| Formatting | **WASM formatter module** inside a language pack | Text in, text out, with no imports, so it can't touch files or the network. Same trust tier as a grammar. Loaded only when a pack is installed. An optional user setting points a language at a locally installed tool instead (§5.7). |
| Fuzzy matching | **nucleo** (Rust) | Very fast parallel fuzzy matcher, same role as F3's parallel filter. |
| Workspace walk/search | **ignore** + **grep-searcher** crates | .gitignore-aware, streaming. |
| File watching | **notify** | Reload files changed outside the editor, refresh the index. |
| Encoding | **encoding_rs** + **chardetng** | Detection and round-trip. |
| Signing | **minisign** / ed25519 | Package and registry integrity. |

Rejected:
- egui, used in the earlier plan: weak at rich Markdown and WYSIWYG.
- Monaco: heavy, and Markdown-hostile.
- TextMate grammars: need oniguruma WASM, and regex grammars are slower and less exact than tree-sitter.
- Lezer packs: grammars would be JS code, which means a trust problem.

---

## 2. Architecture

```
┌─────────────────────────── Webview (TS/React)  ───────────────────────────┐
│ Shell UI: tab strip (pins, groups) · panes · sidebar · status bar        │
│ Launcher (Ctrl+P) ── renders results streamed from Rust                   │
│ Editor: CodeMirror 6                                                      │
│   ├─ markdown mode (built-in): source · live · preview · split            │
│   └─ pack host, loaded only if a pack is installed: highlight + format    │
│ Preview: markdown-it + sanitizer, scroll-sync via data-line attrs         │
└───────────────▲──────────────────────────────────────▲────────────────────┘
                │ invoke() commands                    │ Channel<T> streams
┌───────────────┴──────────── Rust core (src/tauri) ───┴────────────────────┐
│ ox-fs       open/save, encoding, EOL, atomic write, watcher               │
│ ox-index    workspace file list, frecency store, nucleo matcher           │
│ ox-search   ripgrep-style full-text search, streaming                     │
│ ox-pkg      registry fetch, verify, install, enable/disable, lazy assets  │
│ ox-session  hot exit: tabs, pins, groups, panes, unsaved buffer snapshots │
│ ox-settings layered JSONC: default < user < workspace < language < pack   │
│ ox-commands registry of command ids (Rust- and TS-side), keymap resolver  │
└───────────────────────────────────────────────────────────────────────────┘
```

Rules:
- **Text buffers live in the frontend** (the CM6 state). Rust handles I/O, indexing, search, packages and persistence. Saves send the text over IPC. Snapshots for hot exit are debounced at about 2 s.
- **Every user action is a command** with a string id, arguments and a `when` context. The menu, keymap, launcher and tab context menus all dispatch through the same registry. This is what makes the launcher "full featured" without special cases.
- **Custom protocol `oxpkg://`** serves installed pack assets (`.wasm`, `.scm`, CSS) to the webview with a strict CSP. `wasm-unsafe-eval` is allowed; `unsafe-eval` is not.
- Linux targets WebKitGTK, which is slower. CI runs tests on all three platforms from milestone M0.

Repo layout:

```
oxide-text/
  src/
    tauri/              Rust app + crates/ (ox-fs, ox-index, ox-search, ox-pkg, ox-session, ox-settings)
    ui/                 React app (shell/, launcher/, editor/, markdown/, tabs/, packages/)
      editor/commands/  one folder per editing feature (multicursor/, lines/, comment/, folding/)
    packs/              first-party packs, one folder each (lang-rust/, lang-python/, keymap-sublime/)
    tools/oxpkg/        CLI: build, lint, sign, publish packs
    scripts/            project scripts (the installer size check)
  docs/
  plan/
```

`src/` also holds the project and tool files: `package.json`, the lockfile, `tsconfig.json`, `vite.config.ts`, and `components.json`. The repository root holds only `docs`, `plan`, `src`, `.github`, and a few Markdown and dot files.

Layout reference: this follows [microsoft/vscode](https://github.com/microsoft/vscode). There, each language is a folder in `extensions/<lang>/` with a manifest, a grammar and a `language-configuration.json`. Each editing feature is a folder in `src/vs/editor/contrib/`. The VSCodium repo is not a model: it holds only build scripts and patches, with no editor source.

---

## 3. Markdown (core product)

### 3.1 View modes (per tab, toggled with Ctrl+Shift+V or the launcher)
| Mode | Behaviour |
|---|---|
| **Source** | Plain CM6 with Markdown syntax colouring. Only Markdown is styled. Code inside fences is plain unless a pack is installed. |
| **Live** | WYSIWYG-lite. Markup is hidden on every line except the one(s) holding the cursor. Headings are sized, emphasis rendered, links collapsed, images shown inline, tables drawn as a grid, task boxes clickable. Built with CM6 decorations and widgets, so the underlying text stays plain Markdown. |
| **Preview** | Read-only rendered HTML. This is the *viewer* mode and the default for files opened from the OS file association (setting). |
| **Split** | Source or Live on the left, Preview on the right, with two-way scroll sync. |

### 3.2 Rendering
- CommonMark + GFM: tables, task lists, strikethrough, autolinks, footnotes.
- YAML front matter is shown as a collapsible metadata card.
- Fenced code blocks are plain monospace by default. If a language pack is installed and enabled, it highlights the block. This ties the Markdown core to the package system. There is no install prompt.
- Relative images and links resolve against the file's folder through a scoped asset protocol.
- Optional **render packs**, never in base: math (KaTeX), diagrams (Mermaid), wiki-links. These are trusted JS packs (§5.4).
- The preview is sanitised by DOMPurify. Remote images are off by default (privacy), and a per-workspace toggle turns them on.

### 3.3 Editing commands (all in the launcher, most bound to keys)
- Bold, italic, strikethrough, inline code, link (Ctrl+Alt+K: with a URL on the clipboard, it wraps the selection). Ctrl+K is kept free as the chord prefix of the VS Code keymap (§7.1).
- Heading level up and down, set heading 1–6.
- Toggle bullet, numbered or task list. Smart list continuation on Enter. Tab and Shift+Tab indent list items. Renumber ordered lists.
- Toggle a task checkbox at the cursor.
- Quote, code block (the language picker lists installed packs, and any language name can still be typed), horizontal rule.
- **Table tools:** insert, add or remove row or column, align column, and auto-format (pad columns) on Tab or save.
- **Paste image:** save to `./assets/<name>-<n>.png` (path configurable) and insert the link. Drag-and-drop files inserts links.
- Paste HTML is converted to Markdown (turndown).
- Outline panel: the heading tree, with click to jump, drag to reorder sections and fold by heading.
- Word count, reading time, selection stats in the status bar.
- Export HTML (self-contained) and PDF (webview print), and copy as rich text.

---

## 4. Ctrl+P Launcher (full-featured)

One overlay replaces the reference's separate goto-anything, command palette and quick panel (F3). The **prefix picks the mode**. With no prefix, results are a blend.

| Prefix | Mode | Source | Result actions |
|---|---|---|---|
| *(none)* | Blended: open tabs → recent → workspace files → top commands | ox-index (nucleo) + frecency | open, open in split, reveal, copy path, pin, add to group |
| `>` | Commands | command registry (with keybinding hints, category, enabled-state) | run, rebind key, toggle favourite |
| `@` | Symbols in file | Markdown headings; pack `tags.scm` for code | jump, select section |
| `@@` | Symbols in workspace | background symbol index | jump |
| `:` | Go to line[:col] | — | jump; `:+10` / `:-5` relative |
| `/` | Full-text search in workspace | ox-search, streamed, regex with `/re/` | open at match, open all in results tab, replace-all (confirm) |
| `#` | Find in current file (fuzzy) | CM6 doc | jump, select all occurrences |
| `%` | Tabs and groups | session | switch, close, pin/unpin, move to group, collapse group |
| `~` | Workspaces and recent folders | ox-session | open, open in new window, remove |
| `$` | Snippets | user + pack snippets | insert |
| `+` | Create | typed path | new file/folder (creates parents), new from template |
| `!` | Settings | settings schema | toggle booleans inline, pick enum, open JSON |
| `pkg ` | Packages | registry + installed | install, update, enable/disable, uninstall, view readme |
| `?` | Help | mode list | — |

Composable queries: `readme@install` (file, then symbol), `main.rs:120`, `notes/ >export` (command scoped to a file).

Behaviour:
- **Live preview:** moving through file or symbol results shows the target in a transient preview tab, as the reference does (F3/F4). Enter commits; Esc restores the previous view exactly (scroll and selection).
- **Action menu:** Tab or → on a result opens its secondary actions. Shift+Enter means "open in split". Ctrl+Enter selects several results, and the action then applies to all of them.
- **Ranking:** nucleo score × frecency (exponential decay, stored per workspace) × an open-tab boost. Hidden or ignored files are excluded unless the query starts with `.` or `include_ignored` is on.
- **Performance:** matching runs in Rust on a background pool. Results stream over a Tauri `Channel` and are capped at 200 rendered rows (virtualised list). Target: ≤16 ms per keystroke on a 100k-file repo once indexed.
- **Provider API:** each mode is a provider `{prefix, title, query(q) → stream<Item>, actions(item)}`. Built-ins are in Rust or TS. Packs can add **declarative** providers (static lists or snippet sets). Code providers come later with trusted packs (§5.4).
- **History:** ↑ on an empty input recalls previous queries per mode. The last mode is remembered when Ctrl+P is reopened (optional).
- Ctrl+Shift+P opens straight into `>`, Ctrl+R into `@`, Ctrl+G into `:`, and Ctrl+Shift+F into `/`. These are aliases, not separate UIs.

---

## 5. Language packages (optional, off by default)

### 5.1 Base install contains only
Plain text and Markdown (CM6 Lezer, built in). Small parsers (not styling) read the JSONC settings files and the YAML front matter. One light and one dark theme.

**The base install does no code styling.** This includes JSON: a JSON file shows as plain text until the JSON pack is installed. The tree-sitter runtime and the formatter runtime are not loaded, and not bundled, until the first pack is installed. Everything else is a pack. Target installer size: **≤ 10 MB**.

### 5.2 Pack format `.oxpkg` (zip)
```
manifest.toml
grammar/<lang>.wasm            # tree-sitter grammar compiled to wasm
queries/highlights.scm         # required
queries/injections.scm         # optional (e.g. JS in HTML, SQL in strings)
queries/tags.scm               # optional → @ symbols in launcher
queries/indents.scm, folds.scm # optional
formatter/<lang>.wasm          # optional formatter: text in, text out, no imports
config/language.json           # comment tokens, brackets, auto-pairs, word chars
config/format.json             # optional: default formatter options and their schema
snippets/*.json                # optional
LICENSE                        # grammar's licence, shown in UI
```
```toml
[package]
id = "lang.rust"            # reverse-ish unique id
version = "1.2.0"
engine = "^1.0"             # oxide-text pack API semver
kind = "language"           # language | theme | snippets | keymap | render (trusted)
license = "MIT"

[provides]
highlight = true            # needs grammar/ and queries/highlights.scm
format = true              # needs formatter/<lang>.wasm; omit for highlight-only packs

[[language]]
id = "rust"
name = "Rust"
extensions = ["rs"]
filenames = []
first_line = '^#!.*\brust-script\b'
fence_aliases = ["rust", "rs"]   # used by Markdown code fences
```

### 5.3 Lifecycle
1. **Detect:** nothing pops up. The status bar shows the language, such as "Plain Text", and its menu lists matching packs. The user installs a pack on purpose, from this menu or from the launcher `pkg ` mode.
2. **Install:** ox-pkg downloads from the registry, checks the sha256 and the ed25519 signature, and unpacks to `<appdata>/packages/<id>/<version>/`. Install is atomic: unpack to temp, then rename.
3. **Load lazily:** the grammar WASM and the formatter WASM are fetched through `oxpkg://` only when a buffer or fence needs them, then cached in memory. No restart.
4. **Enable and disable:** highlighting and formatting are part of the pack and are **on as soon as the pack is installed**. Settings `languages.<id>.highlight` and `languages.<id>.format` switch each part off without an uninstall.
5. **Format:** `editor.format` and `editor.formatSelection` call the formatter of the buffer's language. The formatter is the pack's WASM module, unless the user sets an external tool for that language (§5.7). With no formatter, the command says so and lists matching packs. `editor.formatOnSave` is off by default. Markdown keeps its built-in table formatting (§3.3).
6. **Update and roll back:** the registry index is polled daily (setting). One previous version is kept for rollback.
7. **Offline:** "Install pack from file…" and air-gapped bundles work.
8. **Manage:** with launcher `pkg ` or the Packages tab (a regular sheet kind).

### 5.4 Trust tiers
- **Data packs** (language, theme, snippets, keymap) contain no executable JS, and WASM grammars and formatters have no imports, so they are **installable without a prompt**. The host also limits the memory and run time of a formatter call.
- **Render or code packs** (KaTeX, Mermaid, future plugin API) run JS in an isolated iframe or worker with a message API. They need publisher signing plus a one-time permission prompt that lists capabilities (`preview.render`, `launcher.provider`, `fs.read:workspace`, …).

### 5.5 Registry
- A static `index.json`, signed, served from GitHub Pages or a CDN. It lists `{id, versions[{v, url, sha256, size, engine}]}`.
- `tools/oxpkg` builds packs from upstream tree-sitter grammars and lints the queries against the standard capture names.
- First-party set at launch: Rust, Python, JS/TS, JSON, YAML, TOML, HTML, CSS, Bash, Go, C/C++, C#, Java, SQL, Diff. All of them highlight. They also format where a permissively licensed formatter can compile to WASM. The others are highlight-only.

### 5.6 Highlight and format pipelines
CM6 view update → web-tree-sitter incremental parse (in a Worker for files over 1 MB) → run `highlights.scm` over the visible range plus a margin → map capture names (`@keyword`, `@string.special`, …) to theme token classes → CM6 `Decoration.mark`. Injections are resolved recursively (Markdown fences use this same path). With no pack, none of this runs.

Format: command → formatter (the pack's WASM in a Worker, or an external tool, §5.7) with text and options in and text out → a minimal diff against the buffer, applied as one undo step, so cursors and folds survive.

### 5.7 External formatters (optional)
The default formatter is the pack's WASM module. A user can instead point a language at a tool installed on their machine, such as `rustfmt`, `prettier` or `black`.

```jsonc
// settings.jsonc (user level)
"languages": {
  "rust": {
    "formatter": {
      "type": "external",          // default is "pack" (the WASM module)
      "command": "rustfmt",        // found on PATH, or an absolute path
      "args": ["--edition", "2021", "--emit", "stdout"],
      "timeout_ms": 5000
    }
  }
}
```

Rules:
- **Input and output:** the buffer goes to the tool on stdin. The formatted text comes back on stdout. A non-zero exit code or a timeout leaves the buffer unchanged and shows the stderr text.
- **No shell:** the Rust core starts the program directly with the given arguments. It does not use a shell, so no string is parsed as a command line.
- **Trust:** only the **user** settings file can set `type: "external"`. Workspace settings and packs cannot, so opening a project folder can never run a program. A workspace setting for this key is ignored, with a warning.
- **Works without a pack:** an external formatter also works for a language that has no pack installed. The text stays unstyled.
- **Setup help:** the settings UI has a "Test formatter" button that runs the tool on a sample and shows the result. The launcher `!` mode can open the setting.

---

## 6. Tabs: pins, groups, panes

Terms:
- A **pane** is a split region of the window, each with its own tab strip. This is the reference's "group" (F4).
- A **tab group** is a named, coloured set of tabs inside one strip, like browser tab groups.

### 6.1 Pinned tabs
- Pinned tabs sit at the left of the strip, in pinned order. A compact icon-only style is optional (setting `tabs.pinned_compact`).
- They are skipped by "Close Others", "Close to the Right", "Close All" (unless forced) and middle-click. Ctrl+W asks first (setting).
- A transient or preview tab can't be pinned. Pinning promotes it to a real tab first.
- Pins persist per workspace in the session. A pinned tab whose file was deleted shows as "missing", with Locate and Remove actions.
- Commands: `tab.pin`, `tab.unpin`, `tab.togglePin`, `tab.focusPinned(n)` (Alt+1..9 focuses pinned tabs).

### 6.2 Tab groups
- Create from the tab context menu, the launcher (`%`) or a multi-tab selection: "New group from selected tabs".
- Each group has a name, a colour (8-colour palette) and a collapsed or expanded state. Collapsed shows a single chip with the count.
- Drag a tab onto a group chip to add it, or drag it out to remove it. Drag the chip to reorder the whole group, or drop it on another pane to move the whole group.
- A tab belongs to at most one group. Pinned tabs can't be grouped (simpler model; open question Q4).
- Group actions: rename, recolour, collapse, close group (asks if anything is unsaved), ungroup, move to new window, **save as tab set** (reopen later from launcher `%`).
- The sidebar "Open Tabs" view is a tree: Panes → Pinned / Groups / Ungrouped.

### 6.3 Model (session JSON, owned by ox-session)
```ts
Window { panes: Pane[], layout: SplitTree, activePane }
Pane   { id, tabs: TabRef[], groups: Group[], activeTab, previewTab?: TabRef }
TabRef { id, uri, kind: "text"|"markdown-preview"|"image"|"packages"|"results"|"settings",
         pinned: boolean, groupId?: string, viewState: {mode, scroll, selections} }
Group  { id, name, color, collapsed }
```
Invariants, checked in tests:
- Pinned tabs come first.
- The tabs of a group are contiguous.
- `previewTab` is never pinned or grouped.

### 6.4 Hot exit
Matches F4. On quit, every window, pane, tab, pin, group and unsaved buffer is snapshotted to `<appdata>/sessions/<workspace-hash>/` and restored on launch. Each unsaved buffer is stored with its base-file hash, so external changes can be detected on restore.

---

## 7. Other baseline editor features (parity list, trimmed)
- **Find/replace** in file: regex, case, whole word, in selection, preserve case.
- Multi-cursor, column select, split selection into lines (CM6). Default keys and configuration are in §7.1.
- Sidebar folder tree: create, rename, delete-to-trash (`trash` crate), reveal, git status badges (`gix`, read-only, later).
- Split layouts: 1–4 panes, grid. Drag tabs between panes and windows.
- Minimap (later; low priority for Markdown).
- Distraction-free, zen and typewriter modes. These matter for a Markdown-first app.
- Settings UI generated from a JSON schema, with the raw JSONC still editable. Keymap editor, with record-a-key in the launcher.
- CLI: `oxt <path>[:line]`, `oxt --wait` for git commit messages. Single-instance forwarding (tauri-plugin-single-instance).
- File associations for `.md` and `.markdown`. "Open with oxide-text" opens in Preview by default.
- Auto-update (tauri-plugin-updater, signed).

### 7.1 Default keymap and configuration
The default keymap follows VS Code and Sublime Text. CM6 already has most of these actions as built-in commands, so we mostly bind them to our command ids.

| Keys | Command id | Action |
|---|---|---|
| `Ctrl+D` | `selection.addNextOccurrence` | Select the next occurrence of the selection |
| `Ctrl+K Ctrl+D` | `selection.skipOccurrence` | Skip this occurrence and select the next |
| `Ctrl+Shift+L` | `selection.selectAllOccurrences` | Select all occurrences |
| `Ctrl+L` | `selection.line` | Select the line |
| `Ctrl+Alt+Up` / `Ctrl+Alt+Down` | `cursor.addAbove` / `cursor.addBelow` | Add a cursor above or below |
| `Alt+Click` | `cursor.addAtClick` | Add a cursor at the click |
| `Ctrl+U` | `cursor.undo` | Undo the last cursor move |
| `Alt+Up` / `Alt+Down` | `lines.moveUp` / `lines.moveDown` | Move the line |
| `Shift+Alt+Up` / `Shift+Alt+Down` | `lines.copyUp` / `lines.copyDown` | Copy the line |
| `Ctrl+Shift+D` | `lines.duplicate` | Duplicate the line (Sublime) |
| `Ctrl+Shift+K` | `lines.delete` | Delete the line |
| `Ctrl+Enter` / `Ctrl+Shift+Enter` | `lines.insertBelow` / `lines.insertAbove` | Insert a line below or above |
| `Ctrl+]` / `Ctrl+[` | `indent.more` / `indent.less` | Indent or outdent |
| `Ctrl+/` | `comment.toggleLine` | Toggle the line comment |
| `Ctrl+Shift+\` | `bracket.jumpToMatch` | Jump to the matching bracket |
| `Shift+Alt+F` | `editor.format` | Format the document |

Comment commands read the comment tokens from the language's `config/language.json`. Markdown uses `<!-- -->`. In plain text they do nothing.

Configuration:
- **No key is hard coded.** Every binding maps keys to a command id (§2).
- **Layers**, last wins: default < keymap preset pack < user < workspace.
- **File:** `keybindings.jsonc`, a list of `{ "key", "command", "args", "when" }`. A `-` before the command removes a binding, as in VS Code: `{ "key": "ctrl+d", "command": "-selection.addNextOccurrence" }`.
- **Chords** are supported (`ctrl+k ctrl+d`). `mod` means Ctrl on Windows and Linux, and Cmd on macOS.
- **Presets** are `kind = "keymap"` packs: VS Code (the default), Sublime Text, and later Vim and Emacs (open question 7). One setting, `keymap.preset`, switches between them.
- **Keymap editor** (M6): search by command or by keys, record-a-key, and warnings for conflicts. The launcher `>` mode has a "rebind key" action for any command (§4).
- **Layouts:** keys match the typed character by default. The setting `keymap.physical_keys` matches the key position instead, for non-US layouts.

---

## 8. Milestones

| M | Scope | Exit criteria |
|---|---|---|
| **M0 Skeleton** (1–2 wk) | Tauri 2 + React + CM6. Open, save and save-as with encoding and EOL. Basic tabs, command registry, keymap resolver with the default VS Code/Sublime keymap and `keybindings.jsonc` overrides (§7.1), JSONC settings, light/dark theme. CI for Win, mac and Linux. | Opens and edits a 10 MB file. Installer ≤10 MB on all three OSes. |
| **M1 Markdown** (2–3 wk) | Source, Preview and Split modes, scroll sync, formatting commands, lists, tables, paste image, outline, export HTML. | All §3.3 commands are in the registry. Sanitizer tests pass. |
| **M2 Launcher v1** (2 wk) | Overlay UI. Modes none, `>`, `@` (headings), `:`, `%`. Rust index + nucleo, frecency, preview tab. | ≤16 ms per keystroke on a 100k-file fixture repo. |
| **M3 Tabs** (2 wk) | Pins, groups, panes, drag and drop, sidebar Open Tabs, hot exit. | Invariant property tests. Kill-and-restore test loses nothing. |
| **M4 Packages** (3 wk) | `.oxpkg` format, ox-pkg, registry, signature checks, web-tree-sitter host, formatter host, external formatter setting, `editor.format`, lazy load, fence highlighting, `tools/oxpkg`, 6 first-party packs. | Install, highlight, format, uninstall with no restart. Bad signature refused. With no pack installed, no tree-sitter or formatter code loads. |
| **M5 Launcher v2** (2 wk) | `/` search, `#`, `~`, `$`, `+`, `!`, `pkg `, action menus, multi-select, composable queries, provider API. | Every launcher mode has e2e tests (WebdriverIO + tauri-driver). |
| **M6 Live mode + polish** (3 wk) | Live (WYSIWYG-lite) mode, distraction-free, CLI, file associations, updater, settings UI, keymap editor, keymap presets, remaining first-party packs. | Beta. |
| **M7 Trusted packs** (later) | iframe/worker sandbox, permission prompts, KaTeX and Mermaid render packs, code providers. | — |

**M0 status (2026-11-10):** built. Deviations from this plan: the keymap resolver and command registry are TypeScript in the frontend, not `ox-commands` in Rust. Settings are read once at startup. The default keymap lacks `Ctrl+K Ctrl+D` (skip occurrence), and `editor.format` waits for M4. Closing a dirty tab asks only "discard?", with no "save" choice. Not yet measured: the macOS and Windows installer sizes, and opening a 10 MB file in the running app (the editor-state test passes).

**M1 status (2026-11-10):** built, with gaps. Built: source, split, and preview modes with scroll sync; every §3.3 editing command (see `docs/operations/configuration.md` for the default keys); format tables on save; paste image and paste HTML; dropped files as links; outline panel (click to jump) and folding by heading; word count, reading time, and selection stats; export to HTML, print to PDF, and copy as rich text. Not built: drag to reorder sections in the outline, and the Live mode (M6). Default view mode stays `source` (open question 2). Not verified in the running app: the editing commands, paste, scroll sync, PDF print (`window.print()` in WebKitGTK), the clipboard read for the link command, and the effect of the content security policy on remote images. The sanitizer, the commands, and the helpers have unit tests.

Testing: Rust unit and property tests (proptest) for the session, index and pkg crates. Vitest for the UI logic. WebdriverIO + tauri-driver for e2e on Windows and Linux (macOS has no WebDriver for WKWebView, so manual plus Playwright on component builds). Perf benchmarks in CI with a fixture repo.

---

## 9. Risks
| Risk | Mitigation |
|---|---|
| WebKitGTK on Linux is slow or has quirks | Test on Linux from M0. Avoid heavy CSS effects. Virtualise every long list. |
| One very long Markdown block (for example a 10 MB file with no blank lines) | The Markdown parser time grows with the square of the block size. M0 measured about 150 ms at 3,600 lines in one block, and minutes at 10 MB. A file with a block over 5,000 lines opens as plain text (`src/ui/editor/large.ts`). Normal 10 MB Markdown parses in under 100 ms. |
| Very large files (>50 MB) in CM6 | Above a threshold, open a read-only chunked viewer with no highlighting. |
| tree-sitter WASM cost on huge files | Worker parse, visible-range queries, and a time budget per frame. |
| Package supply chain | Signed index plus per-file hashes, data-only default tier, permission prompts for code packs. |
| Formatter packs are untrusted code that runs on user text | WASM with no imports, memory and time limits, signed packs. A failed or timed-out call leaves the buffer unchanged. |
| External formatter setting could run a program from a hostile project | Only the user settings file can set it. Workspace settings and packs are ignored for this key. No shell. Timeout on every call. |
| Key conflicts between VS Code, Sublime, OS and Markdown shortcuts | One command registry, conflict warnings in the keymap editor, Ctrl+K kept as a chord prefix, tests that check the default keymap for duplicates. |
| IME / accessibility in Live mode | Live decorations never replace text nodes under the cursor line. Screen-reader pass at M6. |
| Name or branding resemblance | Own name, icons, themes, defaults and file formats. Common keyboard conventions only. |

---

## 10. Open questions (please decide)
1. ~~Frontend framework?~~ **Decided: React, with shadcn/ui and Tailwind CSS (ADR 0010).**
2. **Default mode for opened `.md`:** Preview (viewer-first) or Live?
3. **Knowledge-base features** (wiki-links, backlinks, tags, daily notes): core, a pack, or out of scope?
4. **Can pinned tabs also belong to a group?** The current plan says no, to keep the model simple.
5. **Registry hosting:** GitHub Pages under your account, or self-hosted?
6. **Plugin API for third-party code packs:** wanted at all, or data-only packs forever?
7. **Vim/Emacs keymaps** as packs: in scope for v1?
8. **Licence** for oxide-text itself (affects which grammars can be redistributed; tree-sitter grammars are mostly MIT).
9. ~~How do packs format code?~~ **Decided: a WASM formatter module inside the pack, plus an optional user setting that points a language at a locally installed tool (§5.7).**
10. ~~Should JSON also be a pack?~~ **Decided: yes.** JSON files and settings files show as plain text in the base install.
11. ~~Install suggestion chip?~~ **Decided: no chip.** Highlighting and formatting are part of the pack and are on when the pack is installed.
