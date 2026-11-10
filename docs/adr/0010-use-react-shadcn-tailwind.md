---
status: accepted
date: 2026-11-10
deciders: [Oz]
---

# 0010 — Use React, shadcn/ui, and Tailwind for the frontend

## Context

[ADR 0002](./0002-use-svelte-5-typescript-vite.md) proposed Svelte 5. The
owner chose React instead, with shadcn/ui and Tailwind CSS. The webview
holds the tab strip, panes, launcher, editor, and preview. CodeMirror 6
handles the text area. The framework builds the UI around it.

## Decision Drivers

- The owner's skill and preference
- The largest ecosystem and hiring pool
- Ready-made accessible components for menus, dialogs, tabs, and command lists
- Components that live in the repository, so the team can change them

## Considered Options

- **Svelte 5:** a smaller runtime. The ecosystem is smaller, and the owner prefers React.
- **SolidJS:** the same reactivity model as Svelte. The ecosystem is smaller.
- **React with shadcn/ui and Tailwind:** the largest ecosystem. shadcn/ui copies its components into the repository.

## Decision

We will use **React with TypeScript and Vite**. We will build the UI with
**shadcn/ui** components and **Tailwind CSS** for styles.

## Consequences

- The React runtime is larger than Svelte's. It still adds little to a 10 MB installer, but the installer size target needs a check in milestone M0.
- React re-renders more than a fine-grained framework. Keep the launcher and tab strip fast: virtualise long lists, and keep the editor outside React state.
- Mount CodeMirror 6 as a plain view in a component. Do not copy the text buffer into React state.
- shadcn/ui components are source files in the repository. The team owns them and maintains them. Its Radix primitives supply the accessibility.
- shadcn/ui needs Tailwind. The team has not set the Tailwind version or the shadcn configuration.
- The team has not chosen a state library. See [frontend/state.md](../engineering/frontend/state.md).
- Avoid heavy CSS effects. Linux uses WebKitGTK, which is slow.
