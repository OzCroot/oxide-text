# Environments

oxide-text is a desktop application. It has no server and no database.

## Development

- Run `pnpm tauri dev`. Vite serves the frontend on port 1430. The port is fixed, because Tauri expects it. It is not the Tauri default (1420), so this project can run beside another Tauri project.
- `pnpm dev` alone does not work for file access. The editor needs the Tauri shell.

## Config folder

The app reads `settings.jsonc` and `keybindings.jsonc` from the Tauri app
config folder. On Linux this is `~/.config/dev.oxide-text.app/`. If a file
has an error, the app starts and shows the error in a banner.

## Production

Users install the application from a signed installer. See
[deployment.md](./deployment.md).

## Data on the user's machine

The application stores its data in the application data folder
(`<appdata>`):

| Path | Content |
|------|---------|
| `<appdata>/packages/<id>/<version>/` | Installed packs |
| `<appdata>/sessions/<workspace-hash>/` | Hot-exit snapshots of tabs, groups, and unsaved buffers |

## Secrets

- The repository must not hold secrets. This includes the signing keys for installers and packs.
- The team has not chosen where to keep signing keys. See [deployment.md](./deployment.md).
