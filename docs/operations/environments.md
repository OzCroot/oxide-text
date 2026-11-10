# Environments

oxide-text is a desktop application. It has no server and no database.

## Development

Not yet set up. The team defines the dev workflow in milestone M0.

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
