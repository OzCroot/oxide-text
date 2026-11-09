# Build order and open questions

## Suggested stages

Each stage ends with something usable that can be tried and judged.

### Stage 1 — A plain editor that runs everywhere
- Window, menu bar, tabs, status bar, dark/light theme.
- New / open / save / save as / close with "unsaved changes" prompts; drag and drop.
- Line numbers, current line, word wrap toggle, text size.
- `--screenshot` option for automatic checks.

### Stage 2 — Markdown writing
- Markdown colouring in the editor (bigger headings, coloured emphasis, list markers).
- Formatting bar, Format menu and shortcuts for every action in PLAN.md §3.2.
- List and quote continuation on Enter; Tab/Shift+Tab indenting.
- Align table and Clean up document.

### Stage 3 — Preview
- Edit / Split / Preview views; live preview with tables, task checkboxes (clickable),
  quotes, code blocks.
- Export as HTML.

### Stage 4 — Code reading
- Language detection and colouring for code files and fenced code blocks.
- Set Syntax picker; read-only mode.
- Minimap.

### Stage 5 — Finding and navigating
- Find / replace bar with highlighted matches.
- Command Palette, Go to File, Go to Heading, Go to Line.
- Side bar: open files, outline, folder tree.

### Stage 6 — Polish
- Welcome tab, cheat sheet, About.
- Settings and open tabs remembered between sessions (if chosen).
- Release builds for Windows, macOS and Linux.

## Open questions to decide

| # | Question | Options | Current assumption |
| --- | --- | --- | --- |
| 1 | Editing style | Plain Markdown with colours + preview / WYSIWYG that hides the marks / both | Plain + preview |
| 2 | Default view for Markdown | Split / Edit only / Preview only | Split |
| 3 | Images in preview | Show real images from disk / placeholder with alt text | Placeholder (v1) |
| 4 | Export formats | HTML only / also PDF / also Word (.docx) | HTML only |
| 5 | Remember session | Reopen last tabs & settings / start fresh | Not decided |
| 6 | Custom fonts | Built-in only / let user pick system fonts | Built-in only |
| 7 | Spell-check | None / basic English / multiple languages | None (v1) |
| 8 | Files changed outside the app | Ignore / warn / auto-reload | Ignore (v1) |
| 9 | Line endings | Keep as-is / show in status bar / allow converting | Keep as-is |
| 10 | Non-UTF-8 files | Refuse / open read-only with warning / detect encoding | Read-only with warning |
| 11 | Huge files (> 10 MB) | Normal / read-only without colours | Read-only without colours |
| 12 | Shortcut clashes (Ctrl+Shift+N/T/Q) | Keep for lists/quote / match other editors | Keep for lists/quote |
| 13 | Extra Markdown | Math (LaTeX), diagrams (Mermaid), front-matter, footnotes | Footnotes only |
| 14 | Name and icon | "Oxide Text" placeholder / something else | Placeholder |

## What isn't known about the original

The original program wasn't looked inside (clean room), and no picture of it running
was available, so its exact colours and proportions weren't copied. The layout here
(side bar, tabs, minimap, bottom find bar, command palette) follows the general style of
fast programmer's editors. Adding a screenshot of the look you want would let the plan
pin down colours and spacing.
