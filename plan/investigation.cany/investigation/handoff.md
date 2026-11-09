# Handoff

Person asked: no build, only documentation of how app works so they can refine plan. Wrote app/README.md, PLAN.md, SHORTCUTS.md, ARCHITECTURE.md, ROADMAP.md (14 open questions). app/src has unbuilt drafts (theme, highlight, markdown, preview, commands) + stub main.rs; not wired. Did NOT run cargo build or rebuild_check per person's wish. cargo shim in ~/.cargo/bin broken; use ~/.rustup/toolchains/stable-x86_64-pc-windows-msvc/bin directly. Deps fetched (egui 0.33.3). Next: person refines plan, answers open questions, then build stage 1.
