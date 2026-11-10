---
status: accepted
date: 2026-11-10
deciders: [Oz]
---

# 0009 — Dispatch every action through a command registry with a configurable keymap

## Context

Users know the VS Code and Sublime Text shortcuts, such as `Ctrl+D` and
`Ctrl+Shift+L`. The owner wants those as the default, and wants all of them
configurable. The menu, the launcher, and the tab menus also run actions.

## Decision Drivers

- Familiar default shortcuts
- Full user control of the keymap
- One place for every action, so the launcher needs no special cases
- Few conflicts between shortcuts

## Considered Options

- **Hard-coded shortcuts per feature:** fast to write, but a user cannot change them.
- **One keymap with no layers:** simple, but it cannot support presets or workspace overrides.
- **A command registry with string ids, and a layered keymap:** every action has an id, and the keymap only maps keys to ids.

## Decision

We will give **every action a command id**, and map keys to ids in a layered
keymap: default, preset pack, user, workspace. The default follows VS Code
and Sublime Text. The VS Code folder `src/vs/editor/contrib/` is the layout
reference for the editing features.

## Consequences

- No shortcut is hard coded.
- The link command uses `Ctrl+Alt+K`, because `Ctrl+K` is a chord prefix.
- Keymap presets are packs. Vim and Emacs presets are an open question.
- A test must check the default keymap for duplicate bindings.
- The default keymap copies Sublime Text bindings. This may conflict with the clean-room rule in [constraints](../product/constraints.md). The owner must resolve it.
- See [the plan, section 7.1](../../plan/OXIDE-TEXT-PLAN.md#71-default-keymap-and-configuration).
