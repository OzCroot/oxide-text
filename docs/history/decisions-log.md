# Decisions Log

This file records business and product decisions. An ADR records a
*technical* decision instead. See [../adr/](../adr/).

**How this file differs from [timeline.md](./timeline.md):** timeline.md
records a project event or a milestone. This file records the decision the
team made, and the reason.

| Date | Decision | Reason |
|------|----------|--------|
| 2026-11-10 | The base install does not style code. | Keep the install small. |
| 2026-11-10 | Each language pack adds both highlighting and formatting. | One install gives the user the full language support. |
| 2026-11-10 | Highlighting and formatting are on when a pack is installed. There is no install prompt. | The user installs a pack on purpose, so no second step is needed. |
| 2026-11-10 | JSON is a pack. | Keep the base install free of code styling. |
| 2026-11-10 | Pack formatters are WASM modules. A user setting may point a language at an installed tool. | The sandbox is safe and works offline. The setting gives access to the real tools. |
| 2026-11-10 | The default keymap follows VS Code and Sublime Text. The link command is `Ctrl+Alt+K`. | Users know these keys. `Ctrl+K` is a chord prefix. |
| 2026-11-10 | The frontend uses React, shadcn/ui, and Tailwind CSS. This replaces Svelte. | The owner prefers React. It has the largest ecosystem, and shadcn/ui gives accessible components. |
| 2026-11-10 | pnpm is the package manager. | Fast, strict, and CI can pin its version. See ADR 0011. |
| 2026-11-10 | App source and project files are under `src/`: `src/ui`, `src/tauri`, `package.json`, and the Vite and TypeScript config. The repo root holds only `docs`, `plan`, `src`, and `.github`. The `scripts/` folder is under `src/` too. | A tidy root. |
| 2026-11-10 | A file with a Markdown block of more than 5,000 lines opens as plain text. | The Markdown parser takes minutes on a 10 MB file with one block. |
| 2026-11-10 | Remote images in the preview are off by default, and the sanitizer is the only gate (the policy allows `https:` images so the setting can work). See ADR 0012. | Opening a file must not contact the network. |
| 2026-11-10 | Table columns are padded when a Markdown file saves (setting `markdown.formatTablesOnSave`, on by default). | The plan says to format on Tab or save. |
| 2026-11-10 | The default view mode of a new tab is source. | Open question 2 in the plan is still open. |
| 2026-11-10 | The app draws its own title bar and has no native one. See ADR 0013. | The native bar is missing on some Linux compositors, and it differs on each system. |
| 2026-11-10 | A menu bar under the title bar, shown by a hamburger button. The menus are hard coded for now. | The owner will set the content later. |
