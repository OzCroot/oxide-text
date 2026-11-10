# Third-Party Integrations

oxide-text has no server. It connects to the services below.

## APIs & Services

| Service | Purpose | Docs |
|---------|---------|------|
| Package registry | Serves the signed `index.json` and the packs. Host not chosen. | [ADR 0007](../adr/0007-signed-static-package-registry.md) |
| Update feed | Serves signed application updates | [ADR 0008](../adr/0008-distribution-with-tauri-bundler-and-updater.md) |
| Upstream tree-sitter grammars | The source that `tools/oxpkg` builds language packs from | [the plan, section 5.5](../../plan/OXIDE-TEXT-PLAN.md#55-registry) |

The editor also starts a formatter that the user installs, when the user
sets one. See [ADR 0005](../adr/0005-formatters-wasm-with-external-option.md).
