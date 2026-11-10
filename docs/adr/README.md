# Architectural Decision Records

An ADR records one significant technical decision: what the team chose, why,
who decided, and what other options the team considered. An ADR answers a
question every new developer should be able to ask: *"why do we use
Tauri?"*

## Format

Use [../templates/adr.md](../templates/adr.md) (MADR-lite). Every ADR in this
repo has:

- **Frontmatter:** `status`, `date`, `deciders`
- **Context** — the situation that led to this decision
- **Decision drivers** — the factors that mattered when the team chose
- **Considered options** — the other options on the table
- **Decision** — what the team chose, and why
- **Consequences** — the trade-offs the team accepted

All six items are required. This repo does not accept the single-paragraph ADR
format from the `/domain-modeling` skill's `ADR-FORMAT.md`. Use the full
template above for every ADR, including ADRs the `/domain-modeling`,
`/grill-with-docs`, `/improve-codebase-architecture`, and `/triage` skills
create.

## Numbering

Use the form `NNNN-short-slug.md`, for example `0001-use-tauri-with-rust-core.md`. Numbers
run in sequence. Do not reuse a number, even after a decision is superseded.

## Kickoff batch

At the start of a project, write one ADR for each foundational technical
choice before you write any other engineering documentation. Cover:

- [x] The backend framework and language
- [x] The frontend framework, if the project has one
- [x] The CMS or platform, if the project has one (none: the project has no CMS)
- [x] Each major third-party integration
- [x] The hosting and deployment target

## Iterating

After the kickoff batch, add a new ADR whenever the team makes a comparable
decision — not only the large ones. Write an ADR when a future developer
would ask "why did we do it this way?" two years from now.

This is a broader rule than `ADR-FORMAT.md`'s three-part gate (hard to
reverse, surprising, and the result of a real trade-off). Use this repo's
rule, not the skill's stricter one.

## Superseding

Do not edit or delete an old ADR when a decision changes. Set its `status` to
`superseded` and link to the new ADR. Keep the old ADR's Context and Decision
sections as the historical record — they describe what the team believed at
the time, even after the decision changes.

## Status values

Use one of: `proposed`, `accepted`, `superseded`, `deprecated`.
