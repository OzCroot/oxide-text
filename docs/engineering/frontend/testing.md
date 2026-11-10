# Frontend Testing

See [the plan, section 8](../../../plan/OXIDE-TEXT-PLAN.md#8-milestones).
Run `pnpm test` in `src/` for the unit tests. M1 has 441 tests in 19 files.

- **Unit tests (built):** Vitest, for the UI logic. They cover the Markdown commands (list, table, heading, format, and block edits, with a fake view), the sanitizer (script, event handlers, `javascript:` links, mutation XSS, frames, forms, SVG, remote and `data:` images, and what must survive), link and path handling, heading extraction, scroll sync, HTML-to-Markdown paste, key parsing, the keymap resolver (layers, `-` removal, `when`, chords), the default keymap, the settings checks, and a 10 MB document in the editor state.
- **DOM tests:** a file that starts with `// @vitest-environment jsdom` runs with a DOM. The sanitizer and paste tests need it.
- **Not yet written:** the tests below are the plan. There is no end-to-end test and no component test.
- **End-to-end tests:** WebdriverIO with `tauri-driver`, on Windows and Linux. Each launcher mode has an end-to-end test.
- **macOS:** it has no WebDriver for WKWebView. Test by hand, and with Playwright on component builds.
- **Performance:** benchmarks in CI with a fixture repository. The launcher target is 16 ms or less per keystroke on a repository of 100,000 files.
- **Sanitiser:** tests must show that the preview removes unsafe HTML.
- **Keymap (built):** a test checks the default keymap for duplicate bindings, unknown commands, and that `Ctrl+K` stays free.
- **Tab invariants:** see [state.md](./state.md#invariants).
