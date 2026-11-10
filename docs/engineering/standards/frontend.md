# Frontend Coding Standards

The project has no frontend code yet. This file records the decided
rules. The team sets the linter, the formatter, and the TypeScript options
in milestone M0.

## TypeScript

- The frontend language is TypeScript. See [ADR 0002](../../adr/0002-use-svelte-5-typescript-vite.md).
- The team has not set the compiler options.

## Linting and Formatting

Not set.

## Editor Rules

- The CodeMirror state holds the text buffers. The Rust core does not.
- Live mode must never replace the text nodes on the cursor line.
- Every user action is a command with a string id. Do not hard code a shortcut.
- Virtualise every long list.
- Avoid heavy CSS effects. Linux uses WebKitGTK, which is slow.

## Styles

Not set.

## Import Aliases

Not set.
