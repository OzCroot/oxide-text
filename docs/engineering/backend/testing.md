# Backend Testing

Run `cargo test --workspace` in `src/tauri`.

- **Unit tests:** Rust tests in each crate. `ox-fs` has 11 and `ox-settings` has 6. They cover encodings, line endings, atomic save, a 10 MB round trip, and settings merging.
- **Not yet written:** the tests below are the plan.
- **Property tests:** `proptest`, for the `ox-session`, `ox-index`, and `ox-pkg` crates. The session tests check the tab invariants in [../frontend/state.md](../frontend/state.md#invariants).
- **Hot exit:** a kill-and-restore test must lose nothing.
- **Packs:** an install, highlight, and uninstall test needs no restart. A pack with a bad signature must fail to install.
- **Formatters:** a failed or timed-out external formatter must leave the buffer unchanged.
- **Performance:** benchmarks in CI with a fixture repository.
- **CI:** runs on Windows, macOS, and Linux from milestone M0.
