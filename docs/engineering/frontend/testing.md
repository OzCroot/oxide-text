# Frontend Testing

See [the plan, section 8](../../../plan/OXIDE-TEXT-PLAN.md#8-milestones).
Run `pnpm test` in `src/` for the unit tests. M0 has 43 tests in 5 files.

- **Unit tests (built):** Vitest, for the UI logic. They cover key parsing, the keymap resolver (layers, `-` removal, `when`, chords), the default keymap, the settings checks, and a 10 MB document in the editor state.
- **Not yet written:** the tests below are the plan. There is no end-to-end test and no component test.
- **End-to-end tests:** WebdriverIO with `tauri-driver`, on Windows and Linux. Each launcher mode has an end-to-end test.
- **macOS:** it has no WebDriver for WKWebView. Test by hand, and with Playwright on component builds.
- **Performance:** benchmarks in CI with a fixture repository. The launcher target is 16 ms or less per keystroke on a repository of 100,000 files.
- **Sanitiser:** tests must show that the preview removes unsafe HTML.
- **Keymap (built):** a test checks the default keymap for duplicate bindings, unknown commands, and that `Ctrl+K` stays free.
- **Tab invariants:** see [state.md](./state.md#invariants).
