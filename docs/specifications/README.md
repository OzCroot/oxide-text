# Specifications

This file is a lookup table. It names, for each non-trivial feature, the
file that holds its spec, and states the reasoning behind the feature in
one line. Until the team writes a separate spec file for a feature, the spec
is a section of [the plan](../../plan/OXIDE-TEXT-PLAN.md).

## When to add a row

Add a row for a feature complex enough to have its own rules, edge cases,
or non-obvious history. Add one when, months later, someone might ask "why
does this work this way?" and the only answer lives in a person's memory or
a chat thread. A simple feature that follows an existing pattern does not
need a row.

## How agents should use this table

- **Do not search by keyword.** If a row exists for the feature you work
  on, read the spec it names directly.
- **Back-link from code.** A file that implements a feature with a spec
  must carry a header comment. The comment points at the spec, for example:
  ```
  // spec: plan/OXIDE-TEXT-PLAN.md#6-tabs-pins-groups-panes
  ```
  This comment lets an agent that edits the code find the spec. It also
  lets a future reader confirm the spec is still current.
- **If a feature needs a spec and none exists**, add a section to the plan,
  or create a file in this folder. Then add a row here before you implement
  the feature.
- **When a feature outgrows its plan section**, move the spec to its own
  file in this folder. Update the row and the code back-links in the same
  commit.

## Lookup table

| Feature | Spec | Reasoning |
|---------|------|-----------|
| Markdown view modes | [Plan §3.1](../../plan/OXIDE-TEXT-PLAN.md#31-view-modes-per-tab-toggled-with-ctrlshiftv-or-the-launcher) | The user reads, edits, or does both, in one tab. |
| Relative links and images | [Plan §3.2](../../plan/OXIDE-TEXT-PLAN.md#32-rendering) | Linked documents must work from any folder. |
| Markdown editing commands | [Plan §3.3](../../plan/OXIDE-TEXT-PLAN.md#33-editing-commands-all-in-the-launcher-most-bound-to-keys) | Markdown is the core product, so its commands get first-class support. |
| Launcher | [Plan §4](../../plan/OXIDE-TEXT-PLAN.md#4-ctrlp-launcher-full-featured) | One overlay replaces three, with a mode for each kind of search. |
| Language packs | [Plan §5](../../plan/OXIDE-TEXT-PLAN.md#5-language-packages-optional-off-by-default) | Code styling is off in the base install to keep it small. |
| External formatters | [Plan §5.7](../../plan/OXIDE-TEXT-PLAN.md#57-external-formatters-optional) | A user may prefer the real tool, but a project folder must never run a program. |
| Pinned tabs and tab groups | [Plan §6](../../plan/OXIDE-TEXT-PLAN.md#6-tabs-pins-groups-panes) | Users with many documents need to keep and organise them. |
| Hot exit | [Plan §6.4](../../plan/OXIDE-TEXT-PLAN.md#64-hot-exit) | The user can quit at any time and lose nothing. |
| Keymap and configuration | [Plan §7.1](../../plan/OXIDE-TEXT-PLAN.md#71-default-keymap-and-configuration) | Users know VS Code and Sublime Text keys, and want to change them. |
