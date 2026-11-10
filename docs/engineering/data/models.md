# Data Models

## Overview

The project has no database and no ORM. It defines its data models by hand,
in Rust and in TypeScript. The project has no code yet. This file records
the decided models, with the source of each.

## Models

| Model | Owner | Defined in |
|-------|-------|------------|
| Session: Window, Pane, TabRef, Group | `ox-session` | [frontend/state.md](../frontend/state.md#session-model) |
| Pack manifest (`manifest.toml`) | `ox-pkg` | [the plan, section 5.2](../../../plan/OXIDE-TEXT-PLAN.md#52-pack-format-oxpkg-zip) |
| Registry index (`index.json`) | `ox-pkg` | [api.md](./api.md#registry-index) |
| Settings (layered JSONC) | `ox-settings` | [configuration](../../operations/configuration.md) |
| Keybinding entry | `ox-commands` | [configuration](../../operations/configuration.md#keybindings) |

## Pack manifest

The manifest is TOML. The plan defines these fields:

```toml
[package]
id = "lang.rust"
version = "1.2.0"
engine = "^1.0"          # oxide-text pack API version
kind = "language"        # language | theme | snippets | keymap | render
license = "MIT"

[provides]
highlight = true
format = true

[[language]]
id = "rust"
name = "Rust"
extensions = ["rs"]
filenames = []
first_line = '^#!.*\brust-script\b'
fence_aliases = ["rust", "rs"]
```

## Adding New Models

1. Define the model in the crate that owns it.
2. Define the matching TypeScript type for the frontend.
3. Update the table above.
4. If the model is stored on disk, plan how to read an older version.
