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
