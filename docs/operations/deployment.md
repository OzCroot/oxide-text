# Deployment

The project has no pipeline yet. This file records the decided approach.
See [ADR 0008](../adr/0008-distribution-with-tauri-bundler-and-updater.md).

## Build Pipeline

- The Tauri bundler builds installers for Windows, macOS, and Linux.
- CI runs the tests on all three systems from milestone M0.
- The installer size target is 10 MB or less on every system.

## Updates

- The application updates itself with `tauri-plugin-updater`.
- Update releases are signed.
- The team has not chosen the host of the update feed.

## Package registry

The registry is a static, signed `index.json`. The host is open question 5
in [the plan](../../plan/OXIDE-TEXT-PLAN.md#10-open-questions-please-decide).
See [ADR 0007](../adr/0007-signed-static-package-registry.md).

## Hosting

- **Platform**: not chosen
- **Database**: none
