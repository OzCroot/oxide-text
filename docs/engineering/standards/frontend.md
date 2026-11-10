# Frontend Coding Standards

This file records the rules that the code follows. Milestone M0 sets the
TypeScript options. The project has no linter or formatter yet.

## TypeScript

- The frontend language is TypeScript. See [ADR 0010](../../adr/0010-use-react-shadcn-tailwind.md).
- `src/tsconfig.json` turns on `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noUnusedParameters`.
- Run `pnpm typecheck`.

## Linting and Formatting

Not set. `.editorconfig` sets the base style.

## Editor Rules

- The CodeMirror state holds the text buffers. The Rust core does not.
- Live mode must never replace the text nodes on the cursor line.
- Every user action is a command with a string id. Do not hard code a shortcut. Do not add a CodeMirror key map: the command registry owns every key.
- Do not add `codeLanguages` to the Markdown extension. Code in a fence stays plain until a language pack is installed.
- Virtualise every long list.
- Keep the launcher and the tab strip fast. React re-renders more than a fine-grained framework.
- Avoid heavy CSS effects. Linux uses WebKitGTK, which is slow.

## Styles

- Use Tailwind CSS for styles.
- Use shadcn/ui components. They are source files in the repository, so the team maintains them.
- Tailwind 4 is set up in `src/ui/index.css`. Colours are CSS variables on `:root`, with a `.dark` class for the dark theme. CodeMirror reads the same variables.
- `src/components.json` holds the shadcn configuration. Only the `Button` component is added so far.

## Import Aliases

| Alias | Path |
|-------|------|
| `@/*` | `src/ui/*` |

The alias is set in `src/tsconfig.json` and `src/vite.config.ts`.
