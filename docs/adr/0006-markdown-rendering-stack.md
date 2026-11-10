---
status: proposed
date: 2026-11-10
deciders: [Oz]
---

# 0006 — Use markdown-it with DOMPurify for the preview, and comrak for export

## Context

The preview renders CommonMark and GitHub Flavored Markdown in the webview.
The same output must be possible without the UI, for HTML export and for a
command line tool. The preview must be safe against hostile Markdown.

## Decision Drivers

- Fast, incremental re-render in the preview
- A plugin system that matches the add-on packs
- The same output in the UI and in a headless export
- Safe output

## Considered Options

- **markdown-it in the webview only:** fast, but a headless export then needs a second renderer.
- **comrak in Rust only:** one renderer, but each preview update crosses the IPC boundary.
- **markdown-it with DOMPurify for the preview, and comrak with ammonia for export:** each part is used where it is strongest.

## Decision

We will use **markdown-it with DOMPurify** in the webview, and **comrak with
ammonia** in the Rust core for export.

## Consequences

- Two renderers must give the same output for the supported syntax. Tests must compare them.
- The preview must sanitise all output, and must not load remote images unless the workspace allows it.
- Render packs, such as KaTeX and Mermaid, run JavaScript. They are a separate trust tier and come later.
