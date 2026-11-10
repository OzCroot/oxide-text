---
source: plan/OXIDE-TEXT-PLAN.md (revision 2) and direction from the project owner
date: 2026-11-10
informed-by: Oz
---

# Business Rules

> **What belongs here:** hard, testable policies the system enforces —
> not the reasoning behind them (see [domain.md](./domain.md)) and not
> external constraints outside the system's control (see
> [constraints.md](./constraints.md)).
>
> Test: if the statement fits the pattern "the system must/must not X",
> it is a business rule.

The team has decided these rules. The project has no code yet, so none of
them is implemented.

## Rules

- **No code styling in the base install:** the base install must not highlight or format code. Only an installed language pack may do it — see [../specifications/README.md](../specifications/README.md)
- **A pack is on when installed:** highlighting and formatting must be on as soon as a pack is installed. The user may switch each one off per language.
- **No auto-format on save by default:** `editor.formatOnSave` must be off until the user turns it on.
- **A failed format changes nothing:** if a formatter fails or times out, the buffer must stay unchanged.
- **External formatters are user-only:** only the user settings file may set an external formatter. Workspace settings and packs must not set it. The system must ignore a workspace value and warn.
- **No shell for external formatters:** the system must start the tool directly with the given arguments. It must not use a shell.
- **Packs are verified:** the system must check the sha256 and the signature of a pack before it installs it. It must refuse a bad signature.
- **Data packs have no code:** a language, theme, snippet, or keymap pack must not contain executable JavaScript. A WASM grammar or formatter must have no imports.
- **Render and code packs ask first:** a pack that runs JavaScript must show a permission prompt once.
- **Preview output is sanitised:** the system must sanitise the rendered preview. It must not load remote images unless the workspace allows it.
- **Relative links resolve from the file:** a relative link or image path must resolve against the folder of the file that contains it.
- **A very long block opens as plain text:** the editor must not run the Markdown parser on a file with a block of more than 5,000 lines. The parser takes minutes on such a file.
- **Saving keeps the encoding:** the system must save a file in the encoding it was read in, with the same byte order mark. It must refuse to save text that the encoding cannot hold.
- **One group per tab:** a tab must belong to at most one group. A pinned tab must not be in a group. The tabs of a group must be next to each other.
- **Pinned tabs come first:** pinned tabs must sit before all other tabs in a strip. Bulk close commands must skip them.
- **A preview tab is transient:** a preview tab must never be pinned or grouped.
- **Hot exit loses nothing:** on restart, the system must restore every window, pane, tab, pin, group, and unsaved buffer.
- **No shortcut is hard coded:** every shortcut must map to a command id, and the user must be able to change it.

## Why This Matters to Agents

An agent asked to implement a feature may generate code that violates an
unstated business rule. Nothing tells the agent that the rule exists. Record
each rule here in enough detail for an agent to check it directly. Agents
implement code and review code.

## Related

- [domain.md](./domain.md) — why these rules exist
- [constraints.md](./constraints.md) — external non-negotiables, not system rules
- [../specifications/](../specifications/) — where the team implements rules
