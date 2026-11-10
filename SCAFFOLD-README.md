# AI Directory Scaffold — Implementation Guide

> **For agents.** This file is your instruction set. Read the whole file
> before you start. Your task: scan the host codebase and any available
> client discovery material (kickoff calls, briefs, Confluence access). Fill
> every `docs/` template file with real project data. Remove any file that
> does not apply. Produce a completed knowledge base, not a scaffold.

---

## How This Works

This `docs/` directory contains template documentation files with
`<!-- SCAFFOLD -->` comments and `{{PLACEHOLDER}}` markers. You will:

1. Scan the codebase and any available discovery material to understand the project
2. Replace every placeholder with real, verified information
3. Delete files and directories that do not apply
4. Remove all scaffold markers from completed files
5. Update `AGENTS.md` to match the final file set

**Output:** A fully populated `docs/` knowledge base with zero placeholders
remaining.

---

## Review Process

**Important:** After you complete each milestone, pause. Present the work to
the user for review before you move on. Do not batch several milestones
together.

1. Complete all tasks in the current milestone
2. Check off (`[x]`) completed task checkboxes in **this file** as you go — this is your progress tracker
3. Verify the milestone checkpoint passes
4. **Stop and summarise what was written, changed, or deleted**
5. **List all files that were created, modified, or deleted** so the user can review them
6. **Ask the user if they would like to make a git commit** for this milestone before continuing
7. Wait for the user to review, give feedback, and approve
8. Only proceed to the next milestone after explicit approval

This process lets the user correct course early. It also lets the user
commit each milestone as one unit of work, and keeps the Git history clean.

---

## Milestone 1 — Discovery & Foundational Docs

> Scan the codebase and any available business context. Then write the
> business why-and-what layer before you write any engineering
> documentation. Templates usually skip this milestone, but it gives the
> most benefit to an agent that works on this project later. Do not rush
> it.

### Discovery tasks

- [x] Read `package.json`, `*.csproj`, `pyproject.toml`, `Cargo.toml`, or equivalent to identify the tech stack, dependencies, and scripts
- [x] Read config files (`tsconfig*.json`, `vite.config.*`, `webpack.config.*`, `next.config.*`, `.eslintrc*`, `.prettierrc*`, `appsettings*.json`, `.env.example`) to identify tooling and conventions
- [x] Read the project entry points (for example, `main.ts`, `Program.cs`, `index.ts`, `app.py`) to understand the application bootstrap
- [x] Scan the directory structure (`src/`, `frontend/`, `backend/`, `Views/`, `pages/`, `components/`) to understand the project layout
- [x] Identify: backend framework, frontend framework, bundler, CSS approach, database, CMS/platform (if any), package manager
- [x] Identify: existing coding standards from linter/formatter configs
- [x] Identify: existing tests, test framework, test file conventions
- [x] Check whether the project has Confluence access through the Atlassian MCP. If it does, discover the space or spaces that hold product context, milestones, and feature specs, and populate `docs/agents/confluence.md` with each space's key, purpose, and root page
- [x] Ask the user for any kickoff call transcripts, briefs, or notes not already in the repo — these are the primary source for `product/`

### Product tasks

- [x] Create the Confluence page for `overview.md` first, through the Atlassian MCP — see `docs/agents/confluence.md`. Populate it with the full client, business goals, project rationale, and guiding principles content. Then set `confluence_page:` in `overview.md`, and write the local summary to the shape `docs/agents/confluence.md` defines. Do not restate the Confluence content in full.
- [x] Create the Confluence page for `users.md` first, the same way. Populate it with the full roles, user stories, content-author expectations, and per-user non-negotiables content. Then set `confluence_page:`, and write the local summary to the shape `docs/agents/confluence.md` defines.
- [x] Create the Confluence page for `domain.md` first, the same way. Populate it with the full rationale for each non-obvious domain concept. Then set `confluence_page:`, and write the local summary to the shape `docs/agents/confluence.md` defines.
- [x] Populate `product/business-rules.md` directly in the repo — hard, testable policies the system must enforce. This file is locally authoritative; it needs no Confluence page.
- [x] Populate `product/constraints.md` directly in the repo — external non-negotiables (stakeholder-specific, timeline, compliance) that shape how the team plans and runs the project. This file is locally authoritative; it needs no Confluence page.
- [x] Add frontmatter (`source`, `date`, `informed-by`) to every file above
- [x] Optional: set `confluence_page:` on `business-rules.md` or `constraints.md` if a stakeholder-readable copy exists on Confluence. Neither file's local content changes either way

### Specifications & history tasks

- [x] Start the lookup table in `specifications/README.md`. Add a row for any complex feature already visible from discovery, even before its Confluence page exists (see the file for the "when to add a row" test; full spec-writing happens on Confluence, in the Data and Specifications milestone)
- [x] Confirm `docs/history/timeline.md` and `docs/history/decisions-log.md` name the correct Confluence space and page for this project — see `docs/agents/confluence.md`. Edit the link if the space differs from the default

### Milestone 1 notes (completed 2026-11-10)

- **No Confluence.** The project is open source with no client. The product files are fully local. `docs/agents/confluence.md` is deleted, and every reference to it is removed.
- **Specs are local.** `specifications/README.md` links to sections of `plan/OXIDE-TEXT-PLAN.md`. `history/` holds a timeline and a decisions log with local entries.
- **No code yet.** The tech stack and the commands are from the plan, not from config files. Milestone 3 must confirm them once code exists.
- **Discovery material:** `plan/OXIDE-TEXT-PLAN.md` (revision 2), `README.md`, and direction from the project owner. No kickoff transcripts exist.
- **Not confirmed:** the owner has not reviewed the roles in `users.md`.

### Checkpoint

Before proceeding, confirm you can answer:

1. What is the tech stack? (backend, frontend, database, CMS/platform)
2. What are the build/dev/test commands?
3. What is the project directory structure?
4. What CSS/styling approach is used?
5. Does the project have a CMS or platform? If not, leave `engineering/platform/` empty or delete it, and delete `engineering/standards/authoring.md`.
6. What discovery material exists (transcripts, briefs, Confluence access), and who provided it?
7. Every `product/` file has real content, not placeholders. If the team does not yet know a piece of information, leave the section with a one-line "not yet captured" note. Do not guess.
8. `overview.md`, `users.md`, and `domain.md` each name their Confluence page in `confluence_page:`, and each local summary matches the shape `docs/agents/confluence.md` defines, not a restatement of the Confluence page
9. `docs/history/timeline.md` and `decisions-log.md` name the correct Confluence space and page
10. `specifications/README.md`'s lookup table lists any known complex feature, even before its Confluence page exists

---

## Milestone 2 — ADRs (Kickoff Batch)

> Write one ADR for each foundational technical choice before you write
> detailed engineering documentation. This answers "why do we use
> {{FRAMEWORK}}?" for any future developer.

### Tasks

- [x] Create an ADR for the backend framework/language choice
- [x] Create an ADR for the frontend framework choice (if applicable)
- [x] Create an ADR for the CMS/platform choice (if applicable)
- [x] Create an ADR for each major third-party integration
- [x] Create an ADR for the hosting/deployment target
- [x] Use `templates/adr.md` for each ADR. Number them in sequence: `0001-`, `0002-`, and so on

### Milestone 2 notes (completed 2026-11-10)

- Nine ADRs. Four are `accepted` (0004, 0005, 0009 were decided by the owner). The rest are `proposed` because the plan chose them and the owner has not confirmed them.
- No CMS ADR: the project has no CMS. The third-party integrations are in 0003, 0006, and 0007.
- ADR 0009 flags a possible conflict with the clean-room rule.

### Checkpoint

- [x] `adr/` contains one file per major technical choice, each with `status`, `date`, and `deciders` set and no placeholders left
- [x] Each ADR's "Considered Options" section names at least one alternative, even one the team dismissed quickly

---

## Milestone 3 — Core Documentation

> Fill the foundational engineering and operations docs. Every other file
> depends on them.

### Tasks

- [x] Populate `engineering/architecture.md`: the tech stack table, the build commands, a high-level architecture summary, and the code style. Link to `engineering/frontend/architecture.md` and `engineering/backend/architecture.md` for detail
- [x] Populate `operations/getting-started.md` — prerequisites, install steps, dev server commands, access URLs, project structure
- [x] Populate `operations/environments.md` — dev/prod URLs, environment variables, database config, secrets approach
- [x] Populate `operations/deployment.md` — build pipeline steps, output structure, hosting platform
- [x] Populate `operations/configuration.md` — actual config files, environment variable names, entry point bootstrap code
- [x] Populate `engineering/integrations.md` — any third-party APIs, design tools, MCP servers; delete the file if none exist

### Milestone 3 notes (completed 2026-11-10)

- The project has no code, so these files record the decided design. They say "not set" or "not yet available" where the plan has no answer. They do not invent commands, versions, or URLs.
- `integrations.md` is kept. It lists the registry, the update feed, and the upstream grammars. The design-tool and MCP sections are removed.
- Repeat this milestone's checks when M0 creates the first code.

### Checkpoint

- [x] Every `{{PLACEHOLDER}}` in the files above is replaced with a real value
- [x] Every `<!-- SCAFFOLD -->` comment is removed from completed files
- [x] Files with no relevant content have been deleted (for example, `integrations.md` if no integrations exist)

---

## Milestone 4 — Standards & Conventions

> Document the rules for how the team writes code and content.

### Tasks

- [x] Populate `engineering/standards/general.md` — editor config, git branch/commit conventions, naming conventions table (derived from actual codebase patterns)
- [x] Review `engineering/standards/language.md` — keep the writing rules as they are. Add a project-specific term to the approved-terms table each time one becomes load-bearing
- [x] Populate `engineering/standards/frontend.md` — TypeScript config, linter rules, formatter config, CSS approach, import aliases (all derived from config files)
- [x] Populate `engineering/standards/backend.md` — language version, framework conventions, project structure, API patterns (derived from actual code)
- [x] Populate `engineering/standards/authoring.md`: content-editor UX rules, for example property grouping and labelling conventions. **Delete this file** if the project has no CMS or back office
- [x] Review `engineering/standards/component-sizing.md` — keep as-is unless the project needs a different complexity framework

### Milestone 4 notes (completed 2026-11-10)

- No config files exist, so the standards record the plan's decisions only. Linter, formatter, and compiler options say "not set".
- `authoring.md` is deleted (no CMS), and its references in `documentation-guide.md` are removed.
- `component-sizing.md` is kept. A note says to ignore its CMS rows.
- `language.md` is unchanged.
- `general.md` says the main branch is `master`. The template said `main`.

### Checkpoint

- [x] Every convention documented is verified against an actual config file or codebase pattern — no guessing
- [x] Code examples use real import paths and real project patterns
- [x] All placeholders and scaffold comments removed
- [x] Every file you wrote in this milestone follows `engineering/standards/language.md`

---

## Milestone 5 — Architecture Deep Dive

> Document how the team actually builds the frontend, the backend, and the
> platform layer. Delete what does not apply.

### Frontend tasks

- [ ] Populate `engineering/frontend/architecture.md` — real directory layout, component system, service layer, data flow diagram
- [ ] Populate `engineering/frontend/components.md` — actual component file structure, boilerplate from a real component, conventions observed in the codebase
- [ ] Populate `engineering/frontend/styles.md` — actual selector strategy, design tokens (from CSS vars or theme config), responsive breakpoints, a real styled component example
- [ ] Populate `engineering/frontend/animations.md` — actual animation approach; **delete this file** if the project has no animation patterns
- [ ] Populate `engineering/frontend/services.md` — actual services found in the codebase, their locations and responsibilities
- [ ] Populate `engineering/frontend/events.md` — actual event system; **delete this file** if the project uses standard framework events only (React props, Vue emits) with no custom event layer
- [ ] Populate `engineering/frontend/state.md` — actual state management approach (store library, context, URL state, and so on)
- [ ] Populate `engineering/frontend/build.md` — actual bundler config, entry points, output paths, path aliases, dev server setup
- [ ] Populate `engineering/frontend/testing.md` — actual test framework and conventions; keep as a placeholder with recommendation if no tests exist yet
- [ ] **Delete the entire `engineering/frontend/` directory** if the project has no frontend (for example, API-only service)

### Backend tasks

- [ ] Populate `engineering/backend/architecture.md` — real project structure, middleware pipeline, DI setup, logging
- [ ] Populate `engineering/backend/controllers.md` — actual endpoint patterns with a real example from the codebase
- [ ] Populate `engineering/backend/views.md` — actual template/view layer; **delete this file** if the project is API-only with no server-rendered views
- [ ] Populate `engineering/backend/testing.md` — actual test framework; keep as placeholder with recommendation if no tests exist yet
- [ ] **Delete the entire `engineering/backend/` directory** if the project has no backend (for example, static site)

### Platform tasks (skip entirely if no CMS/platform-bound layer)

If the project has **no** platform-specific layer to document:
- [ ] Delete the entire `engineering/platform/` directory, if one exists
- [ ] Delete `engineering/data/content-types-reference.md`
- [ ] Delete `engineering/standards/authoring.md` if not already removed in Milestone 4
- [ ] Skip to checkpoint

If the project **does** have one (for example, a CMS):
- [ ] Copy [`examples/platform-umbraco/`](examples/platform-umbraco/) to `engineering/platform/<platform-name>/` as the starting shape (for example, `engineering/platform/umbraco/`). Adapt or delete each file for the real platform; rename a file whose term does not match the platform's own vocabulary
- [ ] Populate `<platform>/overview.md` — platform, version, admin URL, features in use, content flow
- [ ] Populate `<platform>/content-types.md` — actual page/content types, how to add new ones, data access syntax
- [ ] Populate `<platform>/block-grid.md` — actual grid/layout editor usage; **delete** if not used
- [ ] Populate `<platform>/block-list.md` — actual list editor usage; **delete** if not used
- [ ] Populate `<platform>/media.md` — media types, storage location, template access syntax
- [ ] Populate `<platform>/delivery-api.md` — actual API endpoints, response shapes; **delete** if not using a content API
- [ ] Populate `<platform>/modelling.md` — content architecture, naming conventions, composition patterns

### Checkpoint

- [ ] Every file either contains real project data or has been deleted
- [ ] Code examples reference actual file paths from this codebase
- [ ] No `{{PLACEHOLDER}}` or `<!-- SCAFFOLD -->` markers remain in any file

---

## Milestone 6 — Data & Specifications

> Populate the data-contract quick references. Add to the specifications
> lookup table that Milestone 1 started.

### Tasks

- [ ] Populate `engineering/data/models.md` — actual data model approach (ORM, CMS-generated, manual), list of core models
- [ ] Populate `engineering/data/api.md` — actual HTTP patterns, status codes used, a real fetch/request example, endpoint registry
- [ ] Populate `engineering/data/events.md` — actual custom events, their payloads, naming convention; **delete** if no custom event system exists
- [ ] Populate `engineering/data/content-types-reference.md` — quick-reference table of all content types (CMS projects only; delete otherwise)
- [ ] Add a row to the lookup table in `specifications/README.md` for any complex feature that surfaced since Milestone 1 (see the file for the "when to add a row" test). Create the feature's Confluence page first, through the Atlassian MCP — see `docs/agents/confluence.md` — then add the row

### Checkpoint

- [ ] Data files reflect real data contracts from the codebase
- [ ] `specifications/README.md`'s lookup table accurately lists every known complex feature, whether its Confluence page exists yet or not

---

## Milestone 7 — Finalise

> Clean up, cross-reference, and lock down the knowledge base.

### Tasks

- [ ] Update `AGENTS.md` sitemap — remove entries for deleted files, add entries for any new files created
- [ ] Update `documentation-guide.md`: remove any reading-path entry that references a deleted file
- [ ] Verify all relative links between `docs/` files resolve to existing files
- [ ] Search all `docs/` files for `{{` — confirm zero results
- [ ] Search all `docs/` files for `<!-- SCAFFOLD` — confirm zero results
- [ ] Delete the `examples/` directory — its reference shapes are not part of the finished knowledge base
- [ ] **Ask the user if they want to remove `SCAFFOLD-README.md`** (this file). The project no longer needs it once the knowledge base is complete

### Checkpoint — Final

- [ ] Every `docs/` file contains only real, project-specific documentation
- [ ] No scaffold artifacts remain in the repository
- [ ] `AGENTS.md` sitemap matches the actual files on disk
- [ ] The knowledge base is ready for use by any agent or developer

---

## Rules for the Agent

1. **Only document what exists.** Do not invent a feature, a pattern, or a convention. If you cannot verify a fact from the code or from stated discovery material, do not write it.
2. **Use real examples.** Every code snippet must come from, or closely match, actual project code. Use real file paths, real import aliases, real class names.
3. **Delete without hesitation.** A missing file is better than a file full of placeholders. If a topic does not apply, delete the file.
4. **Keep files focused.** See `documentation-guide.md`'s file conventions for when to split a file. Use bullet points, tables, and code blocks. Do not write prose paragraphs.
5. **One pass per milestone.** Complete every task in a milestone before you move to the next. Use the checkpoints to verify quality.
6. **Track progress in this file.** Check off (`[x]`) each task checkbox as you complete it. This file is the one authoritative record of scaffold progress.
7. **Pause after every milestone.** List every changed file, summarise the work, and ask the user if they want to commit before you continue.
8. **Ask before you delete this file.** At the end of Milestone 7, ask the user for permission to remove `SCAFFOLD-README.md`. Do not delete it without asking.
9. **Never duplicate Confluence content into `docs/`.** Link to the Confluence page instead of copying it. `overview.md`, `users.md`, and `domain.md` match the shape `docs/agents/confluence.md` defines; the full version stays on Confluence.
10. **Provenance is required in `product/`.** Every file in `product/` needs frontmatter. A Confluence-authoritative file also needs a `confluence_page:` field. This is what makes the knowledge base trustworthy over the life of the project.
11. **Follow the language standard.** See `engineering/standards/language.md`. This rule applies to the content you write in this milestone, not only to the standard itself.

## Placeholder Reference

| Placeholder | What to replace with |
|-------------|---------------------|
| `{{PROJECT_NAME}}` | Actual project name |
| `{{CLIENT_NAME}}` | Actual client/business unit name |
| `{{BACKEND_FRAMEWORK}}` | for example, `.NET 10`, `Express 5`, `Django 5` |
| `{{BACKEND_LANGUAGE}}` | for example, `C# 12`, `TypeScript 5`, `Python 3.12` |
| `{{FRONTEND_FRAMEWORK}}` | for example, `React 19`, `Vue 3.5`, `Svelte 5`, `None` |
| `{{BUNDLER}}` | for example, `Vite 7`, `Webpack 5`, `Turbopack`, `None` |
| `{{CSS_APPROACH}}` | for example, `Tailwind v4`, `SCSS`, `CSS Modules`, `Styled Components` |
| `{{DATABASE}}` | for example, `PostgreSQL 17`, `SQL Server`, `MongoDB 8` |
| `{{CMS_PLATFORM}}` | for example, `Umbraco 17`, `WordPress 6`, `Contentful`, `None` |
| `{{PACKAGE_MANAGER}}` | for example, `npm`, `pnpm`, `yarn` |
| `{{PORT}}` | Actual port numbers |
| `{{NODE_VERSION}}` | Minimum Node.js version |
| `{{CONFLUENCE_BASE_URL}}` | for example, `https://example.atlassian.net` |
| `{{CONFLUENCE_SPACE_KEY}}` | Actual Confluence space key, for example `PROD` |
| `{{ROOT_PAGE_TITLE}}` | Title of the space's root documentation page |
| `{{ROOT_PAGE_ID}}` | Confluence page ID of the root documentation page |
| `{{CONFLUENCE_PAGE_URL}}` | Full URL of a specific Confluence page, once created |
