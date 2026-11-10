# Getting Started

The project has no code yet. This file records the planned setup. The team
confirms each step in milestone M0, and updates this file then.

## Prerequisites

- **Rust**, with the Tauri 2 prerequisites for your operating system
- **Node.js**, for the React frontend. The minimum version is not set.
- No database is needed.

## First Run

Not yet available. The repository has no `package.json` or `Cargo.toml`.
The package manager is not chosen.

## Project Structure at a Glance

The planned layout, from [the plan](../../plan/OXIDE-TEXT-PLAN.md#2-architecture). Only `docs/` and `plan/` exist now.

```
src-tauri/            # Rust app, with crates/ (ox-fs, ox-index, ox-search, ox-pkg, ox-session, ox-settings)
ui/                   # React app (shell/, launcher/, editor/, markdown/, tabs/, packages/)
  editor/commands/    # one folder per editing feature
packs/                # first-party packs, one folder each (lang-rust/, keymap-sublime/)
tools/oxpkg/          # CLI: build, lint, sign, publish packs
docs/                 # agent knowledge base
plan/                 # the design plan
```

## Next Steps

- Read [architecture.md](../engineering/architecture.md) for tech stack details
- Check [../engineering/standards/](../engineering/standards/) for code conventions
- Read [the plan](../../plan/OXIDE-TEXT-PLAN.md), section 8, for the milestones
