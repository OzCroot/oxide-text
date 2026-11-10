---
status: proposed
date: 2026-11-10
deciders: [Oz]
---

# 0001 — Use Tauri 2 with a Rust core

## Context

oxide-text is a cross-platform desktop editor for Windows, macOS, and Linux.
The base install must stay small. The target installer size is 10 MB or
less. The editor needs file I/O, a workspace index, fuzzy search, file
watching, and package installs.

## Decision Drivers

- Small installer size
- One codebase for three operating systems
- Fast native code for the index, search, and file work
- A permission model that limits what the webview can do

## Considered Options

- **Electron:** the installer is 80 MB or more. Too large for the size target.
- **egui (Rust, native):** an earlier plan used it. It is weak at rich Markdown and WYSIWYG rendering.
- **Native toolkits per platform:** three codebases. Too much work.
- **Tauri 2:** uses the system webview, and has a Rust backend.

## Decision

We will use **Tauri 2** with a Rust core, because it gives an installer of
about 5 to 10 MB and a webview that renders rich Markdown well.

## Consequences

- Linux uses WebKitGTK, which is slower than the other webviews. CI must test Linux from milestone M0.
- macOS has no WebDriver for WKWebView, so automated end-to-end tests run on Windows and Linux only.
- Text buffers live in the webview. The Rust core handles I/O, indexing, search, packages, and sessions.
- The team needs Rust and TypeScript skills.
