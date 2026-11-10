---
source: plan/OXIDE-TEXT-PLAN.md (revision 2) and README.md
date: 2026-11-10
informed-by: Oz
---

# Users & Audience

> **Why this file exists:** an agent that builds a feature defaults to
> generic assumptions about the user. This file names who uses the system,
> in one line per role. The agent then builds for real people doing real
> jobs.
>
> Keep this file to one table row per role, no prose section.

## Roles

The roles come from the plan. No user research exists yet. The project owner
has not confirmed the list.

| Role | Summary |
|------|---------|
| Markdown writer | Writes and edits many linked Markdown documents, and needs tabs, groups, and relative links that work. |
| Markdown reader | Opens a `.md` file from the operating system to read it, and expects the rendered preview. |
| Developer | Edits some code beside the Markdown, and expects VS Code or Sublime Text shortcuts and optional language packs. |
| Pack author | Builds, signs, and publishes language, theme, and keymap packs with the `oxpkg` tool. |

## Related

- [overview.md](./overview.md) — business goals these users support
- [../specifications/README.md](../specifications/README.md) — per-feature detail, including feature-specific user stories
