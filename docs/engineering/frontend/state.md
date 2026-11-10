# Frontend State

This file records who owns each piece of state. M0 built the tab list and the
editor state. The session model below is the plan, and is not built. See [the plan, section 6.3](../../../plan/OXIDE-TEXT-PLAN.md#63-model-session-json-owned-by-ox-session).

## Who owns what

| State | Owner | Notes |
|-------|-------|-------|
| Text of an open file | CodeMirror state, in the webview | Sent to Rust on save and for snapshots |
| Windows, panes, tabs, pins, groups | `ox-session` (Rust), as session JSON. Not built. | Snapshots are debounced at about 2 s |
| Open tabs (M0) | React state in `workspace.ts`. A tab has an id, a path, a title, the encoding, the byte order mark, the line ending, and the dirty and plain flags. | The text is not in React state |
| Settings | `ox-settings` (Rust), layered JSONC. Read once at startup. | See [configuration](../../operations/configuration.md) |
| Keybindings | The keymap resolver in the frontend (M0), layered | Maps keys to command ids. The plan moves it to `ox-commands`. |
| Installed packs | `ox-pkg` (Rust) | Files under `<appdata>/packages/` |

## Session model

```ts
Window { panes: Pane[], layout: SplitTree, activePane }
Pane   { id, tabs: TabRef[], groups: Group[], activeTab, previewTab?: TabRef }
TabRef { id, uri, kind: "text"|"markdown-preview"|"image"|"packages"|"results"|"settings",
         pinned: boolean, groupId?: string, viewState: {mode, scroll, selections} }
Group  { id, name, color, collapsed }
```

## Invariants

Tests must check these:

- Pinned tabs come first in a strip.
- The tabs of a group are next to each other.
- `previewTab` is never pinned or grouped.
- A tab belongs to at most one group.
- A pinned tab is not in a group.

## Hot exit

On quit, the session is written to `<appdata>/sessions/<workspace-hash>/`.
Each unsaved buffer is stored with the hash of its base file. On restore,
this hash shows whether the file changed outside the editor.
