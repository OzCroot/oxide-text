# Configuration

oxide-text reads settings and keybindings from JSONC files. The project has
no code yet. This file records the decided design. See
[the plan](../../plan/OXIDE-TEXT-PLAN.md#7-other-baseline-editor-features-parity-list-trimmed).

## Settings Layers

The settings layers run from low to high priority:

1. default
2. user
3. workspace
4. language
5. pack

## Keybindings

- **File:** `keybindings.jsonc`, a list of `{ "key", "command", "args", "when" }`.
- **Layers**, last wins: default, keymap preset pack, user, workspace.
- **Remove a binding:** put a `-` before the command id.
- **Preset:** the setting `keymap.preset` selects a keymap pack.
- **Physical keys:** the setting `keymap.physical_keys` matches key positions, for non-US layouts.

## Settings Named in the Plan

| Setting | Purpose | Default |
|---------|---------|---------|
| `languages.<id>.highlight` | Switch highlighting off for one language | on |
| `languages.<id>.format` | Switch formatting off for one language | on |
| `languages.<id>.formatter` | Set an external formatter. Only the user file may set it. | the pack's WASM module |
| `editor.formatOnSave` | Format a file when it saves | off |
| `tabs.pinned_compact` | Show pinned tabs as icons only | not set in the plan |
| `keymap.preset` | Select a keymap pack | VS Code |
| `keymap.physical_keys` | Match key positions, not characters | off |

## Environment Variables

None are defined.

## Secrets Management

- Never commit secrets to the repository
- See [./environments.md](./environments.md) for details
