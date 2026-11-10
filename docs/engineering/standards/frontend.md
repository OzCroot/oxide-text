# Frontend Coding Standards

The project has no frontend code yet. This file records the decided
rules. The team sets the linter, the formatter, and the TypeScript options
in milestone M0.

## TypeScript

- The frontend language is TypeScript. See [ADR 0010](../../adr/0010-use-react-shadcn-tailwind.md).
- The team has not set the compiler options.

## Linting and Formatting

Not set.

## Editor Rules

- The CodeMirror state holds the text buffers. The Rust core does not.
- Live mode must never replace the text nodes on the cursor line.
- Every user action is a command with a string id. Do not hard code a shortcut.
- Virtualise every long list.
- Keep the launcher and the tab strip fast. React re-renders more than a fine-grained framework.
- Avoid heavy CSS effects. Linux uses WebKitGTK, which is slow.

## Styles

- Use Tailwind CSS for styles.
- Use shadcn/ui components. They are source files in the repository, so the team maintains them.
- The team has not set the Tailwind version, the theme tokens, or the shadcn configuration.

## Import Aliases

Not set.
