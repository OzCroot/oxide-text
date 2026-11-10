# Getting Started

## Prerequisites

- **Rust**, with the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system. On Linux, this means the WebKitGTK 4.1 and GTK 3 development packages.
- **Node.js** 24 or later. The project is built with Node 24.
- **pnpm** 10. Run `corepack enable`, or install pnpm. `package.json` pins the version.
- No database is needed.

## First Run

```bash
cd src
pnpm install        # Install the frontend dependencies
pnpm tauri dev      # Build the Rust core, start Vite, and open the app
```

The first Rust build takes several minutes.

## Run the Tests

```bash
cd src
pnpm typecheck
pnpm test
cargo test --workspace --manifest-path tauri/Cargo.toml
```

## Project Structure at a Glance

```
src/
├── package.json      # Frontend dependencies and scripts, with the lockfile
├── vite.config.ts, tsconfig.json, components.json   # Tool config
├── scripts/          # Project scripts (the installer size check)
├── tauri/            # Rust app, with crates/ (ox-fs, ox-settings)
│   ├── crates/       # Library crates
│   ├── src/          # The Tauri app: commands and startup
│   └── capabilities/ # What the webview may call
├── ui/               # React app
│   ├── components/   # shadcn/ui and the tab strip, status bar
│   ├── commands/     # The command registry and the commands
│   ├── keymap/       # Key parsing, the keymap resolver, the default keymap
│   ├── editor/       # CodeMirror setup
│   └── lib/          # Helpers and the Tauri calls
docs/                 # Agent knowledge base
plan/                 # The design plan
.github/              # CI
```

The repository root holds only `docs`, `plan`, `src`, `.github`,
and the Markdown and dot files. All project and tool files are in `src/`.

## Next Steps

- Read [architecture.md](../engineering/architecture.md) for tech stack details
- Check [../engineering/standards/](../engineering/standards/) for code conventions
- Read [the plan](../../plan/OXIDE-TEXT-PLAN.md), section 8, for the milestones
