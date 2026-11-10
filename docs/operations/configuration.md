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

## Settings Built in M0

| Setting | Values | Default |
|---------|--------|---------|
| `theme` | `system`, `light`, `dark` | `system` |
| `editor.fontSize` | 6 to 72 | 14 |
| `editor.wordWrap` | true or false | true |
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
