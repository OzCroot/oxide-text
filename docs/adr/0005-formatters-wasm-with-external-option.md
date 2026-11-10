---
status: accepted
date: 2026-11-10
deciders: [Oz]
---

# 0005 — Run pack formatters as WASM, with an optional external tool

## Context

A formatter is a program, not data. The team must decide where it runs and
what it may do. A formatter runs on the text of the user.

## Decision Drivers

- A pack must be safe to install without a prompt
- The editor must work offline, with the same result on every operating system
- Some users want the official tool for their language
- A project folder must never run a program

## Considered Options

- **WASM module in the pack:** sandboxed, offline, and the same on every system. Only formatters that compile to WASM are possible.
- **External tools only (`rustfmt`, `prettier`):** the real tools, but the user must install each one, and the pack needs a permission model.
- **No formatting in version 1:** the simplest, but it gives less value.

## Decision

We will use a **WASM formatter module in the pack** by default. A user
setting may point a language at a locally installed tool instead.

## Consequences

- The WASM module has no imports. The host limits its memory and run time.
- Only the user settings file may set an external tool. The system ignores a workspace value and warns.
- The system starts an external tool directly, with no shell, and with a timeout.
- A language with no good WASM formatter has a highlight-only pack.
- A failed or timed-out format leaves the buffer unchanged.
- See [the plan, section 5.7](../../plan/OXIDE-TEXT-PLAN.md#57-external-formatters-optional).
