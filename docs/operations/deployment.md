# Deployment

See [ADR 0008](../adr/0008-distribution-with-tauri-bundler-and-updater.md).

## Build Pipeline

- The Tauri bundler builds installers for Windows, macOS, and Linux.
- The GitHub Actions workflow `.github/workflows/ci.yml` runs on Linux, macOS, and Windows. Each job runs the type check, the Vitest tests, the Rust tests, the installer build, and the size check.
- The size check is `src/scripts/check-installer-size.mjs`. It fails if an installer is over 10 MiB.
- The Linux `.deb` built on 2026-11-10 is 1.88 MiB. The macOS and Windows installers are not measured yet. The workflow has not run on GitHub yet.
- The release profile uses `opt-level = "s"`, LTO, `panic = "abort"`, and strips symbols.

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
