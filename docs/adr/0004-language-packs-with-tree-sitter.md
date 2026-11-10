---
status: accepted
date: 2026-11-10
deciders: [Oz]
---

# 0004 — Provide code languages as optional packs that use tree-sitter

## Context

Users edit code in many languages. The base install must stay small, so it
must not carry every language. The owner decided that the base install does
not style code, and that each language pack adds highlighting and
formatting. The reference application bundles all of its 54 language
packages.

## Decision Drivers

- A small base install
- Safe installs, with no arbitrary code from a pack
- Fast, incremental highlighting
- A large set of existing grammars

## Considered Options

- **Bundle all languages:** the reference application does this. The install gets large.
- **TextMate grammars:** need an Oniguruma WASM runtime. The regex rules are slower and less exact.
- **Lezer grammars as packs:** a grammar is JavaScript code, so it raises a trust problem.
- **tree-sitter grammars as WASM, with `.scm` queries:** data only, sandboxed, and incremental.

## Decision

We will provide each language as a separate `.oxpkg` pack with a tree-sitter
WASM grammar and queries. The base install does no code styling. This
includes JSON. A pack turns highlighting and formatting on when the user
installs it.

## Consequences

- A code file or a code fence is plain text until the user installs a pack.
- The tree-sitter runtime is not loaded until the first pack is installed.
- The team must build and publish packs with `tools/oxpkg`.
- Most grammars are MIT licensed. The project licence is not chosen yet, and it decides which grammars the team can redistribute.
- The pack format is in [the plan, section 5](../../plan/OXIDE-TEXT-PLAN.md#5-language-packages-optional-off-by-default).
