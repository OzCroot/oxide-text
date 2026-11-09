# Oxide Text — plan documents

A plan for a cross-platform text editor that keeps the feel of a fast, keyboard-driven
programmer's editor, but puts **writing and formatting Markdown** first, while still
**reading code with syntax colouring**.

> Status: **planning only.** Nothing is being built yet. These documents describe how
> the app is meant to work so the plan can be refined before any building starts.

## Read in this order

| Document | What it covers | Who it's for |
| --- | --- | --- |
| [PLAN.md](PLAN.md) | What the app does, screen by screen, and how each feature behaves | Everyone |
| [SHORTCUTS.md](SHORTCUTS.md) | Every command and its keyboard shortcut | Everyone |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How it would be built: technology, parts, cross-platform notes | Whoever builds it |
| [ROADMAP.md](ROADMAP.md) | Suggested build order in stages, and open questions to decide | Everyone |

## One-paragraph summary

One window. A side bar on the left (open files, document outline, project folder),
tabs across the top, the editor in the middle with line numbers and a small "minimap"
on the right, and a status bar along the bottom. Markdown files get a formatting bar
and a live preview beside the editor (or instead of it). Code files open with colours
for their language and can be locked into a read-only "reading mode". Everything is
reachable from the keyboard through a searchable command list.

## About the draft code in `src/`

Early sketches of a few parts (colours, Markdown formatting actions, the preview, the
command list) were written before the decision to plan first. They are **not built and
not wired together**; treat them as notes that show one possible way to do the work
described in ARCHITECTURE.md. They can be kept, changed or deleted when building starts.
