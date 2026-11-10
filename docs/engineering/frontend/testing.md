# Frontend Testing

The project has no tests yet. This file records the decided approach. See
[the plan, section 8](../../../plan/OXIDE-TEXT-PLAN.md#8-milestones).

- **Unit tests:** Vitest, for the UI logic.
- **End-to-end tests:** WebdriverIO with `tauri-driver`, on Windows and Linux. Each launcher mode has an end-to-end test.
- **macOS:** it has no WebDriver for WKWebView. Test by hand, and with Playwright on component builds.
- **Performance:** benchmarks in CI with a fixture repository. The launcher target is 16 ms or less per keystroke on a repository of 100,000 files.
- **Sanitiser:** tests must show that the preview removes unsafe HTML.
- **Keymap:** a test must check the default keymap for duplicate bindings.
- **Tab invariants:** see [state.md](./state.md#invariants).
