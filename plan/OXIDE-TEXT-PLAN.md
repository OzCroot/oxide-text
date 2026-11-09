# oxide-text — Rebuild Plan (Tauri)

Status: planning only. No code. Revision 1, 2026-11-09.

oxide-text is an original, cross-platform editor focused on **Markdown viewing and editing**. Other languages get syntax highlighting through **optional add-on packages**, so the base install stays small. It has three headline features:

1. A **Ctrl+P launcher** that works as a full app: files, commands, symbols, search, tabs, packages, actions.
2. **Pinned tabs and named tab groups.**
3. **Language packs installed on demand.**

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

What we change: language packs are **not bundled** but installed on demand. The palette and Ctrl+P are **merged** into one launcher with modes. Tab **pinning and named groups** are added on top of panes.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Shell | **Tauri 2** | Uses the system webview, so the installer is about 5–10 MB instead of Electron's 80+ MB. Rust backend. v2 capability permissions. Built-in updater. |
| Frontend | **TypeScript + Svelte 5 + Vite** (SolidJS is an equal alternative) | Small runtime, fine-grained reactivity, good fit for a long-lived editor UI. |
| Editor | **CodeMirror 6** | Proven Markdown support (Lezer markdown + GFM). Decoration API for the live-preview mode. Multi-cursor, folding, search, IME, accessibility. Handles files of 10 MB or more. |
| Markdown render | **markdown-it** (frontend) + **DOMPurify** | Fast incremental re-render for the preview. The plugin system maps onto add-on packages. |
| Markdown export | **comrak** (Rust, GFM) + **ammonia** | Same output headless, for HTML export or CLI use. |
| Language highlighting | **web-tree-sitter** (WASM in webview) + `.scm` queries | Packs are **data only** (a `.wasm` grammar plus queries): no arbitrary JS, sandboxed by WASM, incremental parsing. Large grammar ecosystem, mostly MIT. |
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
┌─────────────────────────── Webview (TS/Svelte) ───────────────────────────┐
│ Shell UI: tab strip (pins, groups) · panes · sidebar · status bar        │
│ Launcher (Ctrl+P) ── renders results streamed from Rust                   │
│ Editor: CodeMirror 6                                                      │
│   ├─ markdown mode (built-in): source · live · preview · split            │
│   └─ highlighter host: web-tree-sitter + pack queries → CM6 decorations   │
│ Preview: markdown-it + sanitizer, scroll-sync via data-line attrs         │
└───────────────▲──────────────────────────────────────▲────────────────────┘
                │ invoke() commands                    │ Channel<T> streams
┌───────────────┴──────────── Rust core (src-tauri) ───┴────────────────────┐
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
  src-tauri/            Rust app + crates/ (ox-fs, ox-index, ox-search, ox-pkg, ox-session, ox-settings)
  ui/                   Svelte app (shell/, launcher/, editor/, markdown/, tabs/, packages/)
  packs/                first-party language/theme packs (built + published separately)
  tools/oxpkg/          CLI: build, lint, sign, publish packs
  docs/
```

---

## 3. Markdown (core product)

### 3.1 View modes (per tab, toggled with Ctrl+Shift+V or the launcher)
| Mode | Behaviour |
|---|---|
| **Source** | Plain CM6 with Markdown syntax colouring. |
| **Live** | WYSIWYG-lite. Markup is hidden on every line except the one(s) holding the cursor. Headings are sized, emphasis rendered, links collapsed, images shown inline, tables drawn as a grid, task boxes clickable. Built with CM6 decorations and widgets, so the underlying text stays plain Markdown. |
| **Preview** | Read-only rendered HTML. This is the *viewer* mode and the default for files opened from the OS file association (setting). |
| **Split** | Source or Live on the left, Preview on the right, with two-way scroll sync. |

### 3.2 Rendering
- CommonMark + GFM: tables, task lists, strikethrough, autolinks, footnotes.
- YAML front matter is shown as a collapsible metadata card.
- Fenced code blocks are highlighted by an **installed language pack if present**, otherwise shown as plain monospace with an "Install <lang> pack" chip. This ties the Markdown core to the package system.
- Relative images and links resolve against the file's folder through a scoped asset protocol.
- Optional **render packs**, never in base: math (KaTeX), diagrams (Mermaid), wiki-links. These are trusted JS packs (§5.4).
- The preview is sanitised by DOMPurify. Remote images are off by default (privacy), and a per-workspace toggle turns them on.

### 3.3 Editing commands (all in the launcher, most bound to keys)
- Bold, italic, strikethrough, inline code, link (Ctrl+K: with a URL on the clipboard, it wraps the selection).
- Heading level up and down, set heading 1–6.
- Toggle bullet, numbered or task list. Smart list continuation on Enter. Tab and Shift+Tab indent list items. Renumber ordered lists.
- Toggle a task checkbox at the cursor.
- Quote, code block (with a language picker drawn from installed packs), horizontal rule.
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

## 5. Language packages (upgrade packs)

### 5.1 Base install contains only
Plain text, Markdown (CM6 Lezer, built in), JSON/JSONC (settings files), and a tiny YAML subset for front matter. One light and one dark theme. Everything else is a pack. Target installer size: **≤ 10 MB**.

### 5.2 Pack format `.oxpkg` (zip)
```
manifest.toml
grammar/<lang>.wasm            # tree-sitter grammar compiled to wasm
queries/highlights.scm         # required
queries/injections.scm         # optional (e.g. JS in HTML, SQL in strings)
queries/tags.scm               # optional → @ symbols in launcher
queries/indents.scm, folds.scm # optional
config/language.json           # comment tokens, brackets, auto-pairs, word chars
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

[[language]]
id = "rust"
name = "Rust"
extensions = ["rs"]
filenames = []
first_line = '^#!.*\brust-script\b'
fence_aliases = ["rust", "rs"]   # used by Markdown code fences
```

### 5.3 Lifecycle
1. **Detect:** on opening an unknown extension, or a fenced block with an unknown alias, a non-modal bar or chip appears: "Install Rust support (240 KB)?"
2. **Install:** ox-pkg downloads from the registry, checks the sha256 and the ed25519 signature, and unpacks to `<appdata>/packages/<id>/<version>/`. Install is atomic: unpack to temp, then rename.
3. **Load lazily:** the grammar WASM is fetched through `oxpkg://` only when a buffer or fence needs it, then cached in memory. No restart.
4. **Update and roll back:** the registry index is polled daily (setting). One previous version is kept for rollback.
5. **Offline:** "Install pack from file…" and air-gapped bundles work.
6. **Manage:** with launcher `pkg ` or the Packages tab (a regular sheet kind).

### 5.4 Trust tiers
- **Data packs** (language, theme, snippets, keymap) contain no executable JS, and WASM grammars have no imports, so they are **installable without a prompt**.
- **Render or code packs** (KaTeX, Mermaid, future plugin API) run JS in an isolated iframe or worker with a message API. They need publisher signing plus a one-time permission prompt that lists capabilities (`preview.render`, `launcher.provider`, `fs.read:workspace`, …).

### 5.5 Registry
- A static `index.json`, signed, served from GitHub Pages or a CDN. It lists `{id, versions[{v, url, sha256, size, engine}]}`.
- `tools/oxpkg` builds packs from upstream tree-sitter grammars and lints the queries against the standard capture names.
- First-party set at launch: Rust, Python, JS/TS, JSON, YAML, TOML, HTML, CSS, Bash, Go, C/C++, C#, Java, SQL, Diff.

### 5.6 Highlight pipeline
CM6 view update → web-tree-sitter incremental parse (in a Worker for files over 1 MB) → run `highlights.scm` over the visible range plus a margin → map capture names (`@keyword`, `@string.special`, …) to theme token classes → CM6 `Decoration.mark`. Injections are resolved recursively (Markdown fences use this same path).

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
- Multi-cursor, column select, split selection into lines (CM6).
- Sidebar folder tree: create, rename, delete-to-trash (`trash` crate), reveal, git status badges (`gix`, read-only, later).
- Split layouts: 1–4 panes, grid. Drag tabs between panes and windows.
- Minimap (later; low priority for Markdown).
- Distraction-free, zen and typewriter modes. These matter for a Markdown-first app.
- Settings UI generated from a JSON schema, with the raw JSONC still editable. Keymap editor, with record-a-key in the launcher.
- CLI: `oxt <path>[:line]`, `oxt --wait` for git commit messages. Single-instance forwarding (tauri-plugin-single-instance).
- File associations for `.md` and `.markdown`. "Open with oxide-text" opens in Preview by default.
- Auto-update (tauri-plugin-updater, signed).

---

## 8. Milestones

| M | Scope | Exit criteria |
|---|---|---|
| **M0 Skeleton** (1–2 wk) | Tauri 2 + Svelte + CM6. Open, save and save-as with encoding and EOL. Basic tabs, command registry, keymap, JSONC settings, light/dark theme. CI for Win, mac and Linux. | Opens and edits a 10 MB file. Installer ≤10 MB on all three OSes. |
| **M1 Markdown** (2–3 wk) | Source, Preview and Split modes, scroll sync, formatting commands, lists, tables, paste image, outline, export HTML. | All §3.3 commands are in the registry. Sanitizer tests pass. |
| **M2 Launcher v1** (2 wk) | Overlay UI. Modes none, `>`, `@` (headings), `:`, `%`. Rust index + nucleo, frecency, preview tab. | ≤16 ms per keystroke on a 100k-file fixture repo. |
| **M3 Tabs** (2 wk) | Pins, groups, panes, drag and drop, sidebar Open Tabs, hot exit. | Invariant property tests. Kill-and-restore test loses nothing. |
| **M4 Packages** (3 wk) | `.oxpkg` format, ox-pkg, registry, signature checks, web-tree-sitter host, lazy load, fence highlighting, `tools/oxpkg`, 6 first-party packs. | Install, highlight, uninstall with no restart. Bad signature refused. |
| **M5 Launcher v2** (2 wk) | `/` search, `#`, `~`, `$`, `+`, `!`, `pkg `, action menus, multi-select, composable queries, provider API. | Every launcher mode has e2e tests (WebdriverIO + tauri-driver). |
| **M6 Live mode + polish** (3 wk) | Live (WYSIWYG-lite) mode, distraction-free, CLI, file associations, updater, settings UI, remaining first-party packs. | Beta. |
| **M7 Trusted packs** (later) | iframe/worker sandbox, permission prompts, KaTeX and Mermaid render packs, code providers. | — |

Testing: Rust unit and property tests (proptest) for the session, index and pkg crates. Vitest for the UI logic. WebdriverIO + tauri-driver for e2e on Windows and Linux (macOS has no WebDriver for WKWebView, so manual plus Playwright on component builds). Perf benchmarks in CI with a fixture repo.

---

## 9. Risks
| Risk | Mitigation |
|---|---|
| WebKitGTK on Linux is slow or has quirks | Test on Linux from M0. Avoid heavy CSS effects. Virtualise every long list. |
| Very large files (>50 MB) in CM6 | Above a threshold, open a read-only chunked viewer with no highlighting. |
| tree-sitter WASM cost on huge files | Worker parse, visible-range queries, and a time budget per frame. |
| Package supply chain | Signed index plus per-file hashes, data-only default tier, permission prompts for code packs. |
| IME / accessibility in Live mode | Live decorations never replace text nodes under the cursor line. Screen-reader pass at M6. |
| Name or branding resemblance | Own name, icons, themes, defaults and file formats. Common keyboard conventions only. |

---

## 10. Open questions (please decide)
1. **Frontend framework:** Svelte 5 (recommended) or SolidJS or React?
2. **Default mode for opened `.md`:** Preview (viewer-first) or Live?
3. **Knowledge-base features** (wiki-links, backlinks, tags, daily notes): core, a pack, or out of scope?
4. **Can pinned tabs also belong to a group?** The current plan says no, to keep the model simple.
5. **Registry hosting:** GitHub Pages under your account, or self-hosted?
6. **Plugin API for third-party code packs:** wanted at all, or data-only packs forever?
7. **Vim/Emacs keymaps** as packs: in scope for v1?
8. **Licence** for oxide-text itself (affects which grammars can be redistributed; tree-sitter grammars are mostly MIT).
