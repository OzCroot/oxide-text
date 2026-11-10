# Documentation Guide

This file explains the `docs/` structure, what each file covers, and how to
navigate `docs/` by role.

## The Taxonomy

`docs/` groups files by **knowledge type**, not by team:

- [`product/`](./product/) answers *why and what*: business goals, users,
  domain rationale, and rules.
- [`engineering/`](./engineering/) answers *how*: architecture and
  conventions.
- [`specifications/`](./specifications/) bridges `product/` and
  `engineering/` for each feature.
- [`adr/`](./adr/) records why the team made a technical decision.
- [`history/`](./history/) records project milestones and business
  decisions.

## Authority of files

This project keeps all documentation in the repository. It has no external
wiki. The model has three tiers:

- **Product files.** `product/overview.md`, `users.md`, and `domain.md` hold
  the business context. Each follows a fixed shape: `overview.md` states the
  client in one line, then at most 3 sentences. `users.md` and `domain.md`
  hold one table row per item and no prose section.
- **Rules and constraints.** `product/business-rules.md` gates behavior the
  code enforces and the team tests. `constraints.md` shapes how the team
  plans and runs the project. Both must stay next to what they constrain.
- **Lookup table.** `specifications/README.md` names the spec of each
  feature. The spec is a section of [`plan/OXIDE-TEXT-PLAN.md`](../plan/OXIDE-TEXT-PLAN.md),
  or its own file in `specifications/`.

`adr/` records a technical decision and is separate from this model.

## Knowledge Base Rules

### When to UPDATE an existing file

- **A frontend or backend pattern changes** → update the matching file in `docs/engineering/frontend/` or `docs/engineering/backend/`
- **Architecture changes** (a new module, service, or endpoint) → update `docs/engineering/architecture.md`
- **The tech stack changes** (the team replaces a dependency) → update `docs/engineering/architecture.md` and add an ADR
- **A technical decision becomes superseded** → set the ADR's `status` to `superseded` and link to the new ADR
- **A business goal, a user, or a domain concept changes** → update the matching `docs/product/` file
- **A business rule or a constraint changes** → update the matching `docs/product/` file directly; it is locally authoritative
- **An agent produces a bad outcome** because it did not know a rule, a convention, or a piece of context → update the doc that should have told it, at that time. This is the most important rule in this guide.

### When NOT to update

- Do not update the knowledge base for a routine code change, such as a bug fix or a small feature that follows an existing pattern
- Do not duplicate information that already exists in `docs/` — link to it instead
- Do not add speculative or planned content — document only what the team has implemented or decided

### Deleting a file or a folder

Before you delete a file or a folder under `docs/`, grep the tree for its
name and for every path it owned. Fix or remove each hit in the same
commit, not a later one.

A renamed file or folder is lower risk — update every reference in the
same commit and the rename is done. A deletion is the higher-risk case: a
reference to a deleted path has nothing to redirect to, so it is easy to
leave dangling. Grep for it anyway; do not assume nothing points to it.

### Definition of done

Check the documentation as part of finishing any non-trivial task. Do not
treat it as a separate task for someone else to do later:

- [ ] Did this change a pattern, an architecture, or a convention documented in `engineering/`? Update it.
- [ ] Did this implement or change a feature that has a spec? Update the spec and its code back-link.
- [ ] Did this involve a technical choice the team should record? Add an ADR.
- [ ] Did an agent produce a bad outcome because the doc was missing context? Fix the doc, not only the code.
- [ ] Does the new prose follow the language standard? See [engineering/standards/language.md](./engineering/standards/language.md).
- [ ] Did this delete a file or a folder under `docs/`? Grep the tree for every reference to it and fix each one.

No tool enforces this checklist. It is the developer's responsibility. Add a
line to the PR checklist, such as "docs updated, or confirmed not needed",
as a reminder.

### Provenance

A fact in `product/` should show when it came from, and from whom. This
matters most on a long-lived project, where staff change and the reason
behind a fact is easy to lose.

- Each file in `product/` carries frontmatter — `source`, `date`,
  `informed-by` — that records who wrote the local copy and when.
- For a fact that needs deeper traceability than frontmatter gives, link to
  [`history/decisions-log.md`](./history/decisions-log.md), or to the
  specific ADR if a technical decision produced the fact.

### Code ↔ spec back-links

Code that implements a feature must carry a header comment. The comment
points at the feature's spec directly:

```
// spec: plan/OXIDE-TEXT-PLAN.md#6-tabs-pins-groups-panes
```

This comment lets an agent that edits the code find the spec directly. It
also lets a future reader confirm the spec is still current. Point a
developer or an agent to the named page. Do not rely on a keyword search to
find it.

### Sitemap maintenance

- When the team adds or removes a file in `docs/`, update the **Directory Structure** tree below. This file is the sole owner of the tree — `AGENTS.md` and `README.md` link here instead of repeating it.
- Give every entry a filename and a one-line description
- Keep the tree structure and its alignment
- Do not list individual `specifications/` or `history/` entries — list only the folder. These folders grow per project; the folder's own index or README is the entry point.

### File conventions

- Write every file in Markdown. Use lowercase kebab-case filenames.
- Split a file when it covers more than one topic, regardless of its length.
- Use relative links between `docs/` documents.
- Follow [engineering/standards/language.md](./engineering/standards/language.md) for prose style.

### Cross-referencing

- **Link; do not duplicate.** When content relates to another file, add a relative link. Do not repeat the information.
- Avoid circular references. If File A links to File B for one concept, File B must not link back to File A for the same concept. Pick one file as the canonical owner and link in one direction.
- When a topic spans multiple files, pick one file as the primary source. Point the other files to it.
- **A named exception may restate a rule instead of linking to it.** Only
  when the rule counters an instruction from a vendored skill under
  `.agents/skills/` that this repo cannot patch directly — those skills are
  hash-locked in `skills-lock.json`. The ADR-format override is the current
  example: it stands in `docs/adr/README.md`, `docs/templates/adr.md`,
  `CLAUDE.md`, and `docs/agents/domain.md`, so an agent hits the override
  wherever it might otherwise read the skill's conflicting rule. State a new
  exception this way, by name, rather than duplicating silently — an
  undocumented restatement is what drifts.

## Directory Structure

```
docs/
├── documentation-guide.md      # this file
├── product/                    # WHY & WHAT
│   ├── overview.md             # business goals, project rationale
│   ├── users.md                # audience: roles, expectations, non-negotiables
│   ├── domain.md                # why domain concepts/features exist
│   ├── business-rules.md       # hard policies the system enforces
│   └── constraints.md          # external non-negotiables
├── specifications/             # lookup table: feature, spec, reasoning
│   └── README.md               # the table + convention
├── engineering/                # HOW
│   ├── architecture.md         # tech stack, high-level structure, build commands
│   ├── standards/              # coding standards (general, language, frontend, backend, component-sizing)
│   ├── frontend/               # frontend patterns & implementation
│   ├── backend/                # backend patterns & implementation
│   ├── data/                   # data models and contracts
│   └── integrations.md         # third-party services
├── adr/                        # Architectural Decision Records
├── history/                     # project milestones and business decisions
├── operations/                  # getting-started, environments, deployment, configuration
├── templates/                   # adr.md
└── agents/                      # agent-tooling config — see AGENTS.md
```

## Reading Paths by Role

### Anyone starting on the project

1. [operations/getting-started.md](./operations/getting-started.md) — get it running
2. [engineering/architecture.md](./engineering/architecture.md) — tech stack overview
3. [product/overview.md](./product/overview.md) — why this project exists
4. [product/users.md](./product/users.md) — who it's for
5. [adr/](./adr/) — why the major technical choices were made

### Frontend Developer

1. Steps above, then:
2. [engineering/standards/frontend.md](./engineering/standards/frontend.md) — language and framework rules
3. [engineering/frontend/architecture.md](./engineering/frontend/architecture.md) — how the frontend works
4. [engineering/frontend/state.md](./engineering/frontend/state.md) — what state exists and who owns it
5. Browse remaining `engineering/frontend/` files as needed

### Backend Developer

1. Steps above, then:
2. [engineering/standards/backend.md](./engineering/standards/backend.md) — language and framework rules
3. [engineering/backend/architecture.md](./engineering/backend/architecture.md) — crates, libraries, and protocols
4. [engineering/backend/testing.md](./engineering/backend/testing.md) — backend tests

### Picking up a new feature

1. Check [specifications/README.md](./specifications/README.md) for an existing row for this feature. Read the spec it names directly; do not search by keyword for context.
2. If no row exists and the feature is non-trivial, write its spec, then add a row to the lookup table, before you implement the feature
3. Check [product/business-rules.md](./product/business-rules.md) and [product/constraints.md](./product/constraints.md) for anything that must hold, regardless of the feature

## Folder Purposes

| Folder | Answers | What it contains |
|--------|---------|-------------------|
| `product/` | Why & what | Business goals, users, domain rationale, rules, constraints |
| `specifications/` | Where to find each feature's spec | A lookup table: feature, spec, reasoning |
| `engineering/` | How | Architecture, standards, and patterns |
| `adr/` | Why this tech choice | Architectural Decision Records |
| `history/` | What happened and what the team decided | Milestones, events, and business decisions |
| `operations/` | How to run it | Setup, environments, deployment, config |
| `templates/` | How to add more | ADR template |
| `agents/` | How skills should operate on this repo | Issue tracker, triage labels, domain-doc layout — not project knowledge |
