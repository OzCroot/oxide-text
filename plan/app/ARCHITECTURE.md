# How it would be built

Technical companion to PLAN.md. Nothing here is built yet.

## Technology

| Need | Choice | Why |
| --- | --- | --- |
| Language | Rust (stable, 2021 edition) | Fast, single executable, no runtime to install. |
| Window + UI | `eframe` / `egui` 0.33, OpenGL (`glow`) renderer | Immediate-mode UI, one code base for Windows/macOS/Linux, supports X11 and Wayland. |
| Code colouring | `syntect` 5.3 with the pure-Rust regex engine (`default-fancy`) | ~50 bundled grammars and themes; no C library (Oniguruma) to compile, which keeps cross-platform builds simple. |
| Markdown parsing (preview + HTML export) | `pulldown-cmark` 0.13 | CommonMark plus tables, strikethrough, task lists, footnotes; gives source positions (needed for clickable checkboxes). |
| File / folder pickers | `rfd` 0.16 | Native dialogs on Windows and macOS; on Linux uses the desktop "portal" so no GTK libraries are required. |
| Screenshot PNG | `image` 0.25 (PNG only) | For the `--screenshot` test option. |

Fonts are egui's built-in ones (sans-serif + monospace + symbol font), so text looks the
same everywhere and nothing depends on installed system fonts.

## Parts (modules)

```
src/
  main.rs        start-up: read command-line args (files, folder, --screenshot), open the window
  app.rs         the App: open documents, settings, which panels show; draws every frame
  document.rs    one open file: text, path, language, unsaved flag, view mode, caches
  editor.rs      the editor widget: text box + line numbers + current line + find highlights + minimap
  highlight.rs   colouring: Markdown highlighter (hand-written) and code (syntect), cached per document
  markdown.rs    formatting actions on plain text: wrap, headings, lists, quotes, links, tables,
                 clean-up, list continuation, outline, word count, search
  preview.rs     Markdown -> small block tree -> egui widgets; HTML export
  commands.rs    list of all commands, labels, shortcuts, fuzzy matching for the palette
  palette.rs     the pop-up command list (commands / files / headings / line)
  sidebar.rs     open files, outline, folder tree
  theme.rs       dark and light colour sets, applied to egui
assets/
  welcome.md, cheatsheet.md, example.rs   built into the executable
```

`highlight.rs`, `markdown.rs`, `preview.rs`, `commands.rs` and `theme.rs` exist as
**unbuilt drafts**; the rest are still to be written.

## Key design decisions

1. **The text is always plain Markdown.** The editor is a normal multi-line text box
   whose colouring comes from a custom "layouter". The preview is a separate read-only
   view. (Alternative considered: a WYSIWYG editor that hides the marks. Rejected for
   v1 — much harder to get right, and it fights with "still a good code reader".)
2. **Formatting actions are pure functions** `(text, selection) -> new selection`
   working in character positions. They don't know about the UI, so they are easy to
   test and reuse from menus, buttons, shortcuts and the palette.
3. **Selections** are read from and written back to egui's text-box state, then the
   editor is re-focused. egui's own undo history records each change, so formatting can
   be undone like typing.
4. **Caching:** colouring is keyed by a hash of (text, language, size, theme) per
   document and only recomputed when one changes. The preview's parsed block tree and the
   minimap's colour strips are cached the same way.
5. **Line numbers and "go to"** are computed from the laid-out text rows, so they stay
   correct with word wrap and with bigger heading text.
6. **Commands are one list.** Menus, toolbar, shortcuts and palette all dispatch the same
   `Cmd` values, so a new command appears everywhere at once.
7. **UI events are collected, then applied** after drawing (open file, switch tab, jump,
   tick checkbox…), which keeps the frame code simple.
8. **Unsaved changes** are checked before closing a tab and when the window's close
   button is pressed (the close is cancelled and a Save / Don't save / Cancel dialog shown).

## Cross-platform notes

| Platform | Build needs | Notes |
| --- | --- | --- |
| Windows 10/11 | Rust (MSVC toolchain) + Visual Studio Build Tools | Produces `oxide-text.exe`. |
| macOS 11+ | Rust + Xcode command-line tools | Ctrl shortcuts become Cmd automatically. Can be wrapped in an `.app` bundle later (`cargo-bundle`). |
| Linux (X11 or Wayland) | Rust + a C compiler; dev packages for `libxkbcommon`, `libGL`/`libEGL`, `libwayland`, `libxcursor`, `libxrandr`, `libxi` | File dialogs go through the XDG desktop portal (most desktops have it). |

Build commands (when building starts): `cargo build --release`; tests: `cargo test`.
Optional later: a CI job building all three platforms on every change.

## Testing

- Unit tests for every function in `markdown.rs` (wrap/unwrap, heading toggle, list
  toggle and numbering, Enter continuation, table alignment, clean-up, search with
  accented text), the Markdown highlighter (coloured text equals original text), the
  preview parser (block types, task-box positions) and fuzzy matching.
- `--screenshot shot.png`: draw ~120 frames with the Welcome tab in Split view, save the
  window picture, exit. Used by automatic visual checks.

## Performance targets

- Start-up under 0.5 s on a typical laptop.
- Typing stays smooth (60 fps) in a 5,000-line Markdown file or 20,000-line code file.
- Very large files (> 10 MB) open read-only with colouring off **(decide)**.
