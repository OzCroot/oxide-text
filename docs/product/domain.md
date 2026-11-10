---
source: plan/OXIDE-TEXT-PLAN.md (revision 2) and direction from the project owner
date: 2026-11-10
informed-by: Oz
---

# Domain Rationale

> **What belongs here:** why a feature or a concept exists, in one line
> per concept. Not a rule the system enforces (see
> [business-rules.md](./business-rules.md)) and not a technical choice
> (see [../adr/](../adr/)) — the reason behind a piece of the domain.
>
> Keep this file to one table row per concept, no prose section.

## Concepts

| Concept | Why it exists |
|---------|----------------|
| Markdown first | The editor targets people who write and read Markdown, so Markdown gets the best view modes and commands. |
| No code styling in the base install | The base install stays small, about 10 MB or less. Code styling is a cost that only some users need. |
| Language pack | A pack adds highlighting and formatting for one language, so users install only the languages they use. |
| Formatter in a sandbox | A pack formatter runs as WASM with no file or network access, so a pack is safe to install without a prompt. |
| External formatter setting | A user may prefer the real tool for a language, such as `rustfmt`. Only the user settings can set it, so a project folder cannot run a program. |
| Live mode | The user edits rendered Markdown, and the raw markup shows only on the line with the cursor. |
| Relative links | Markdown files in a folder link to each other and to images, so the links must work from any folder. |
| Launcher (`Ctrl+P`) | One overlay finds files, commands, headings, tabs, and text, so the user does not need separate palettes. |
| Pinned tab | The user keeps the most used documents in a fixed place that bulk close commands skip. |
| Tab group | The user names and colours related tabs, and collapses them to save space. |
| Hot exit | The user can quit at any time and find every tab, group, and unsaved change on the next start. |
| Shortcuts from VS Code and Sublime Text | Users already know them. All shortcuts are configurable, so no one must keep a default. |

## Related

- [business-rules.md](./business-rules.md) — hard policies (not rationale)
- [../specifications/README.md](../specifications/README.md) — how the team implements these concepts
