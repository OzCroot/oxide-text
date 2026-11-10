---
status: proposed
date: 2026-11-10
deciders: [Oz]
---

# 0002 — Use Svelte 5, TypeScript, and Vite for the frontend

## Context

The webview holds the tab strip, the panes, the launcher, the editor, and the
preview. This UI runs for a long time and updates often. The owner has not
confirmed the framework. It is open question 1 in the plan.

## Decision Drivers

- Small runtime, to protect the installer size
- Fine-grained reactivity for a long-lived UI
- Good TypeScript support
- A fast build and dev server

## Considered Options

- **SolidJS:** an equal alternative. The ecosystem is smaller.
- **React:** the largest ecosystem. The runtime is larger, and it re-renders more.
- **Svelte 5 with Vite:** a small runtime and fine-grained reactivity.

## Decision

We propose **Svelte 5 with TypeScript and Vite**, because it has a small
runtime and fits a long-lived editor UI. The status stays `proposed` until
the owner confirms.

## Consequences

- The UI code lives in `ui/`, with folders for the shell, launcher, editor, markdown, tabs, and packages.
- A switch to another framework later means a rewrite of `ui/`. CodeMirror 6 does not depend on the framework.
