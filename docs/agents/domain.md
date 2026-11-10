# Domain Docs

This file tells the engineering skills how to read this repo's domain
documentation before they explore the code.

> **Regeneration warning.** The `/setup-matt-pocock-skills` skill rewrites
> this file when a user re-runs it. If you re-run that skill, restore the
> [ADR mandate](#write-adrs-with-the-full-template) and the [language
> standard](#follow-the-language-standard) sections below.

> **Not the same file as** [`../product/domain.md`](../product/domain.md).
> That file records domain *rationale* — why a business concept exists, per
> the `docs/product/` taxonomy. This file tells a skill how to read the
> glossary and the ADRs. The two files serve different purposes.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root. This file does not exist yet.
  `/domain-modeling` creates it when the first term needs a definition.
- **`docs/adr/`** — read the ADRs that touch the area you plan to change.

If a file in this list does not exist, proceed. Do not flag its absence, and
do not suggest creating it ahead of need. The `/domain-modeling` skill
creates `CONTEXT.md` and new ADRs when the project resolves a term or a
decision. `/grill-with-docs` and `/improve-codebase-architecture` reach
`/domain-modeling` for this.

## File structure

This is a single-context repo. It has one `CONTEXT.md` and one `docs/adr/`
directory — no monorepo signals exist.

```
/
├── CONTEXT.md            # /domain-modeling creates this file when needed
├── docs/adr/              # existing — see docs/adr/README.md for format and numbering
│   └── ...
└── docs/                  # this repo's own knowledge base
```

## Use the glossary's vocabulary

When your output names a domain concept — in an issue title, a refactor
proposal, a hypothesis, or a test name — use the term `CONTEXT.md` defines.
Do not use a synonym the glossary avoids.

If `CONTEXT.md` does not have the term you need, treat that as a signal.
Either you are using a term the project does not use, or the glossary has a
real gap. Note the gap for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR in `docs/adr/`, state the conflict.
Do not override the ADR silently.

> _This contradicts ADR-0007 (event-sourced orders). Reopen it because…_

## Write ADRs with the full template

Use the full template at [`../templates/adr.md`](../templates/adr.md) for
every ADR — including an ADR that `/domain-modeling`, `/grill-with-docs`, or
`/improve-codebase-architecture` creates while exploring. Do not use the
single-paragraph format from `/domain-modeling`'s `ADR-FORMAT.md`. See
[`../adr/README.md`](../adr/README.md) for the full rule.

## Follow the language standard

Follow [`../engineering/standards/language.md`](../engineering/standards/language.md)
for any new content you write in `CONTEXT.md`, ADRs, or `docs/`.
