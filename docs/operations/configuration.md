# Configuration

oxide-text reads settings and keybindings from JSONC files in the app
config folder. See [environments.md](./environments.md#config-folder).
Milestone M0 builds the items marked "built" below. See
[the plan](../../plan/OXIDE-TEXT-PLAN.md#7-other-baseline-editor-features-parity-list-trimmed).

## Settings Layers

The settings layers run from low to high priority:

1. default (built: `src/tauri/default-settings.jsonc`)
2. user (built: `settings.jsonc`)
3. workspace (not built)
4. language (not built)
5. pack (not built)

Objects merge key by key. Any other value, including an array, replaces the
earlier value. The settings are read once at startup. The app does not
reload them while it runs.

## Settings Built

| Setting | Values | Default |
|---------|--------|---------|
| `theme` | `system`, `light`, `dark` | `system` |
| `editor.fontSize` | 6 to 72 | 14 |
| `editor.wordWrap` | true or false | true |
| `markdown.defaultMode` | `source`, `split`, `preview`: the view mode of a new tab | `source` |
| `markdown.imageDir` | Folder for pasted images, relative to the file. It cannot contain `..` or be absolute. | `assets` |
| `markdown.remoteImages` | Load images from the web in the preview and in exports. See [ADR 0012](../adr/0012-preview-security-model.md). | false |
| `markdown.pasteHtmlAsMarkdown` | Turn pasted HTML into Markdown | true |
| `markdown.formatTablesOnSave` | Pad the columns of tables when the file saves | true |
| `files.defaultEol` | `lf`, `crlf`, `cr` | `lf` |

A bad value falls back to the default.

## Keybindings

- **File:** `keybindings.jsonc`, a list of `{ "key", "command", "args", "when" }`.
- **Layers**, last wins: default (built, in `src/ui/keymap/default-keymap.ts`), keymap preset pack (not built), user (built), workspace (not built).
- **Where it runs:** in M0 the keymap resolver is TypeScript in the frontend, because key events arrive there. The plan puts it in `ox-commands` (Rust), so M0 differs from the plan.
- **`when` clauses:** `editorFocus`, `!key`, and `&&`.
- **Chords:** `ctrl+k ctrl+d` works. The chord times out after 1.5 seconds. M0 has no default chord binding.
- **Not built:** `Ctrl+K Ctrl+D` (skip occurrence) has no command yet. `editor.format` comes with the packs in M4.
- **Remove a binding:** put a `-` before the command id.
- **Preset:** the setting `keymap.preset` selects a keymap pack.
- **Physical keys:** the setting `keymap.physical_keys` matches key positions, for non-US layouts.

## Settings Named in the Plan

| Setting | Purpose | Default |
|---------|---------|---------|
| `languages.<id>.highlight` (not built) | Switch highlighting off for one language | on |
| `languages.<id>.format` (not built) | Switch formatting off for one language | on |
| `languages.<id>.formatter` (not built) | Set an external formatter. Only the user file may set it. | the pack's WASM module |
| `editor.formatOnSave` | Format a file when it saves | off |
| `tabs.pinned_compact` | Show pinned tabs as icons only | not set in the plan |
| `keymap.preset` | Select a keymap pack | VS Code |
| `keymap.physical_keys` | Match key positions, not characters | off |

## Environment Variables

None are defined.

## Secrets Management

- Never commit secrets to the repository
- See [./environments.md](./environments.md) for details

## Default Markdown Keys (M1)

Every key is a command id in `keybindings.jsonc`. See
`src/ui/commands/markdown-commands.ts` and `src/ui/keymap/default-keymap.ts`.

| Keys | Command |
|------|---------|
| `Ctrl+Shift+V` | `view.cycleMode` (source, split, preview) |
| `Ctrl+Alt+O` | `view.toggleOutline` |
| `Ctrl+Alt+M` | `view.toggleMenuBar` |
| `Ctrl+Alt+E`, `Ctrl+Alt+P`, `Ctrl+Alt+Shift+C` | `export.html`, `export.pdf`, `edit.copyAsRichText` |
| `Ctrl+B`, `Ctrl+I`, `Ctrl+Shift+X`, `Ctrl+E`, `Ctrl+Alt+K` | bold, italic, strikethrough, inline code, link |
| `Ctrl+1` to `Ctrl+6`, `Ctrl+0` | heading level 1 to 6, and no heading |
| `Ctrl+Shift+.`, `Ctrl+Shift+,` | heading level up and down |
| `Ctrl+Shift+8`, `Ctrl+Shift+7`, `Ctrl+Shift+9` | bullet, numbered, and task list |
| `Ctrl+Alt+T` | toggle the task checkbox |
| `Ctrl+Alt+Q`, `Ctrl+Alt+C`, `Ctrl+Alt+R` | quote, code block, horizontal rule |
| `Ctrl+Alt+Shift+T`, `Ctrl+Alt+F` | insert table, format table |
| `Enter`, `Tab`, `Shift+Tab` | continue a list, or a quote. Indent a list item. Move between table cells. |
| `Ctrl+Shift+[`, `Ctrl+Shift+]` | fold and unfold |

The commands for table rows and columns, table alignment, and `list.renumber`
have no default key. The launcher (M2) will list them. Until then, bind them
in `keybindings.jsonc`.

`Tab` and `Shift+Tab` in the editor move text or cells, not keyboard focus.
There is no Esc-then-Tab way out of the editor yet.
