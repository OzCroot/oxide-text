# Data Contracts

oxide-text has no HTTP API of its own. This file lists the contracts the
plan defines. The project has no code yet, so none is implemented. The
team adds the exact shapes in the milestone that builds each one.

## Registry index

The registry is a static, signed `index.json`. See
[ADR 0007](../../adr/0007-signed-static-package-registry.md).

```
{ id, versions: [ { v, url, sha256, size, engine } ] }
```

- `v` is the pack version.
- `engine` is the pack API version that the pack needs.
- The editor checks `sha256` and the signature before it installs a pack.

## Frontend and core

- The frontend calls the Rust core with Tauri commands.
- The core streams launcher and search results over a Tauri `Channel`.
- The core serves pack files to the webview through `oxpkg://`.
- The team has not yet named the individual Tauri commands.

## Launcher provider

Each launcher mode is a provider:

```
{ prefix, title, query(q) → stream<Item>, actions(item) }
```

Built-in providers are in Rust or TypeScript. Packs may add declarative
providers, such as static lists or snippet sets.

## Formatter call

A formatter takes text and options, and returns text. A pack formatter is a
WASM module with no imports. An external formatter takes the text on stdin
and returns it on stdout. See
[ADR 0005](../../adr/0005-formatters-wasm-with-external-option.md).

## Command registry

- Every action has a string command id, arguments, and a `when` context.
- The default ids are in [the plan, section 7.1](../../../plan/OXIDE-TEXT-PLAN.md#71-default-keymap-and-configuration).
