---
status: accepted
date: 2026-11-10
deciders: [Oz]
---

# 0011 — Use pnpm as the package manager

## Context

The frontend needs a package manager. Milestone M0 creates the first
`package.json`. The plan did not name one. The shadcn/ui CLI works with all
the common package managers. A reproducible install matters for CI on three
operating systems.

## Decision Drivers

- A lockfile and a frozen install for CI
- Fast installs and a small disk footprint
- Strict dependency resolution, so code cannot import a package it does not declare
- A version pin in the repository

## Considered Options

- **npm:** ships with Node. Slower installs, and it allows undeclared imports through hoisting.
- **Yarn:** a similar result to pnpm. The team has no reason to prefer it.
- **pnpm:** fast, strict, and `corepack` or `pnpm/action-setup` pin its version from `packageManager`.

## Decision

We will use **pnpm**. The `packageManager` field in `package.json` pins the
version. CI runs `pnpm install --frozen-lockfile`.

## Consequences

- Contributors need pnpm. Node's `corepack enable` provides it.
- `pnpm-lock.yaml` is committed. A change to `package.json` must update it.
- Tauri runs `pnpm dev` and `pnpm build` from `tauri.conf.json`.
- `package.json` and the lockfile are in `src/`. Run pnpm from there.
