# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files under `.scratch/`.

`.scratch/` is **committed, not ignored**. This repo has no `.gitignore`
entry for it. `.scratch/` is the tracker itself, not space to discard.

## Conventions

- Use one directory per feature: `.scratch/<feature-slug>/`
- The spec lives at `.scratch/<feature-slug>/spec.md`
- Write each ticket as its own file at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`. Do not combine tickets into one file.
- Record triage state as a `Status:` line near the top of each issue file (see `triage-labels.md` for the label strings)
- Append comments and conversation history to the bottom of the file, under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/`. Create the directory
first, if it does not exist.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user normally passes the path or
the issue number directly.

## Wayfinding operations

The `/wayfinder` skill uses these operations. The **map** is a file with
one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — the Notes, Decisions-so-far, and Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`, `prototype`, `grilling`, or `task`). A `Status:` line records `claimed` or `resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket becomes unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for a file that is open, unblocked, and unclaimed. The lowest number wins.
- **Claim**: set `Status: claimed` and save the file before you start work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer — a short summary and a link — to the map's Decisions-so-far in `map.md`.
