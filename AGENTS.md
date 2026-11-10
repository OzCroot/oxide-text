# AGENTS.md

This file gives guidance to an agent that works on this repository.

## Knowledge Base

All project documentation lives in `./docs/`. See
[`docs/documentation-guide.md`](docs/documentation-guide.md) for the full
taxonomy, the file-by-file sitemap, and the maintenance rules.

- `docs/product/` — why the project exists, its users, and its rules
- `docs/specifications/` — a lookup table to each feature's spec
- `docs/engineering/` — how the code is built
- `docs/adr/` — why the team made each technical choice
- `docs/history/` — project milestones and business decisions
- `docs/operations/` — how to run and deploy the project
- `docs/templates/` — the ADR template
- `docs/agents/` — agent-tooling config, not project knowledge (see below)

`docs/agents/` holds agent-tooling configuration, not project knowledge. It
tells the `mattpocock/skills` engineering skills how to operate on this
repo: the issue tracker, the triage labels, and the domain-doc layout.
To change it, re-run `/setup-matt-pocock-skills`.

> Follow [`docs/engineering/standards/language.md`](docs/engineering/standards/language.md)
> for prose style, and [`docs/documentation-guide.md`](docs/documentation-guide.md#file-conventions)
> for file conventions, including when to split a file.

## Before Starting Work

1. Read `./docs/documentation-guide.md` for documentation standards and the taxonomy
2. Read `./docs/engineering/standards/language.md` for the writing rules this repo follows
3. Read `./docs/product/overview.md` and `./docs/product/users.md` for business context and audience
4. Read `./docs/engineering/architecture.md` for the tech stack and the build commands
5. Check `./docs/engineering/standards/` for code conventions
6. Check `./docs/engineering/frontend/` or `./docs/engineering/backend/` for team-specific patterns
7. Check `./docs/specifications/README.md` for an existing spec before you implement a non-trivial feature
8. Review `./docs/adr/` and `./docs/product/business-rules.md` / `./docs/product/constraints.md` for context you must not violate

## After Completing Work

**Important:** After you complete any significant action, review the
`./docs/` knowledge base and decide whether the team should update the
documentation. See the "Definition of done" checklist in
`./docs/documentation-guide.md`.

Keep the documentation current so a future agent has accurate context. If
an agent produces a bad outcome because context was missing, update the
matching doc right away. Do not let the same gap cause the same outcome
again.
