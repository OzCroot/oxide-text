---
status: proposed
date: 2026-11-10
deciders: [Oz]
---

# 0008 — Ship signed installers with the Tauri bundler and updater

## Context

oxide-text is a desktop application with no server of its own. The team
must decide how it builds, ships, and updates the application.

## Decision Drivers

- Installers for Windows, macOS, and Linux from one pipeline
- Signed updates
- Tests on all three systems from the start

## Considered Options

- **Manual packaging per system:** more work, and easy to get wrong.
- **Store-only distribution:** limits who can install, and slows updates.
- **Tauri bundler with `tauri-plugin-updater`:** one pipeline, signed updates.

## Decision

We will build installers with the **Tauri bundler** and update with
**`tauri-plugin-updater`**, using signed releases. CI runs on Windows, macOS,
and Linux from milestone M0.

## Consequences

- The project needs signing keys and a safe place to keep them.
- The update feed needs a host. The plan does not yet name one.
- A single-instance plugin forwards a second launch to the running window.
