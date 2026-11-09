# How Oxide Text works

This describes the app from the user's side: what you see and what happens when you
do things. Items marked **(decide)** are open choices — see ROADMAP.md.

---

## 1. Goals

1. **Markdown first.** Writing, formatting and previewing Markdown should feel as easy
   as a word processor, without hiding the plain text.
2. **Still a good code reader.** Any source file opens with colours for its language,
   line numbers and fast search.
3. **Fast and keyboard friendly.** Opens instantly, everything has a shortcut, and a
   searchable command list reaches every action.
4. **Runs everywhere.** Windows, macOS and Linux from the same source.
5. **Plain files.** Documents are ordinary `.md` / text files on disk. No database,
   no account, no cloud.

Not goals (for the first version): plugins, collaboration, spell-check, Git
integration, a built-in terminal.

---

## 2. The window

```
┌───────────────────────────────────────────────────────────────────────────┐
│ File  Edit  Format  View  Go  Help                                        │ menu bar
├────────────┬──────────────────────────────────────────────────────────────┤
│ OPEN FILES │ [Welcome.md ●] [example.rs] [notes.md ×]     Edit|Split|Preview│ tabs + view switch
│  Welcome.md├──────────────────────────────────────────────────────────────┤
│  example.rs│ H1 H2 H3 │ B I S </> │ link img │ • 1. ☐ > │ ``` ▦ ― │ Align  │ formatting bar (Markdown only)
│            ├───────────────────────────────┬───────────────────────────┬──┤
│ OUTLINE    │  1  # Welcome                 │  Welcome                  │▓▓│
│  Welcome   │  2                            │  ─────────────            │▒▒│ minimap
│   Features │  3  Some **bold** text and a  │  Some bold text and a     │▒ │
│   Keys     │  4  - [ ] task                │  ☐ task                   │  │
│            │  5  ```rust                   │  ┌ rust ───────────────┐  │  │
│ FOLDER     │  6  fn main() {}              │  │ fn main() {}        │  │  │
│  ▸ docs    │  7  ```                       │  └─────────────────────┘  │  │
│  ▸ src     │        editor                 │        preview            │  │
│    a.md    │                               │                           │  │
├────────────┴───────────────────────────────┴───────────────────────────┴──┤
│ Saved Welcome.md      Ln 3, Col 12 │ 412 words │ 2 min read │ Markdown │ UTF-8│ status bar
└───────────────────────────────────────────────────────────────────────────┘
```

### Parts of the window

| Part | What it does |
| --- | --- |
| **Menu bar** | File, Edit, Format, View, Go, Help. Each entry shows its shortcut. |
| **Side bar** (left, can be hidden) | Three sections: *Open files*, *Outline* (headings of the current Markdown file — click to jump), *Folder* (the opened project folder as a tree — click a file to open it). |
| **Tabs** | One per open file. A dot shows unsaved changes; an × closes it; middle-click also closes. Right end has the view switch for Markdown files (Edit / Split / Preview) or the Read-only toggle for code. |
| **Formatting bar** | Only for Markdown files. Buttons for headings, bold, italic, strikethrough, inline code, link, image, bullet / numbered / task lists, quote, code block, table, divider, and "Align table". Each has a tooltip with its shortcut. Can be hidden. |
| **Editor** | The text itself, with line numbers on the left, the current line softly highlighted, and colours for Markdown or code. |
| **Preview** | The formatted Markdown, updated as you type. |
| **Minimap** (right, can be hidden) | A tiny picture of the whole file in its colours, with a shaded box showing what is on screen. Click or drag to scroll. |
| **Status bar** | Short messages ("Saved notes.md"), cursor line and column, word count and reading time (Markdown), the file's language (click to change), text encoding. |
| **Find bar** (bottom, when open) | Search box, replace box, options for match case and whole word, buttons for next / previous / replace / replace all, and a count of matches. |
| **Command list** (pops up at the top) | Type to filter; arrow keys to choose; Enter to run. Used for commands, going to a file, going to a heading, and going to a line. |

---

## 3. Working with Markdown

### 3.1 How the editor shows Markdown

The text stays plain Markdown, but is coloured to make structure obvious:

- Headings are **larger** (level 1 biggest, down to level 4) and coloured; the `#`
  marks are dimmed.
- `**bold**`, `*italic*` and `~~strike~~` are coloured differently (and italic is
  slanted, strike is crossed out).
- `` `inline code` `` gets a shaded background.
- List markers (`-`, `1.`, `[ ]`) are coloured so lists are easy to scan.
- Quotes (`>`) are slanted and greyed.
- Links show the visible text in link colour and the address dimmed.
- Table pipes `|` are dimmed so the cell contents stand out.
- **Code blocks inside Markdown** (```` ```rust ````) are coloured in that language.

### 3.2 Formatting actions

Every action works on the **selection**, or on the word / line under the cursor when
nothing is selected.

| Action | What happens |
| --- | --- |
| Bold / Italic / Strike / Inline code | Wraps the selection in `**`, `*`, `~~` or `` ` ``. Running it again on already-wrapped text removes the marks. With no selection, inserts the pair and puts the cursor between. |
| Heading 1–4 | Turns the current line(s) into that heading level. Running the same level again turns it back into normal text. "Normal text" removes any heading. |
| Bulleted / Numbered / Task list | Adds `- `, `1. 2. 3.` or `- [ ] ` to every selected line. If every line already has it, removes it. Switching between list types replaces the old marker. |
| Quote | Adds or removes `> ` on each selected line. |
| Link / Image | Wraps the selection as `[text](https://)` and selects the address so you can paste. With no selection, inserts a placeholder with the label selected. |
| Code block | Wraps the selection in ```` ``` ```` fences (or inserts an empty block) and leaves the cursor where the language name goes. |
| Table | Inserts a 3×2 starter table with the first header cell selected. |
| Divider | Inserts `---` on its own line. |
| Align table | Pads every cell of the table under the cursor so the columns line up, respecting left/centre/right alignment marks. |
| Clean up document | Removes trailing spaces (keeping intentional two-space line breaks), collapses runs of blank lines, puts a blank line around headings, changes `*`/`+` bullets to `-`, and aligns every table. **Never touches code blocks.** |

### 3.3 Typing helpers

- **Enter in a list** continues it: `- item` ⏎ gives `- `; `3. item` ⏎ gives `4. `;
  a task line gives a fresh `- [ ] `. Enter on an **empty** list item ends the list.
  Same for quotes.
- **Tab / Shift+Tab** indents / outdents the selected lines. On a list line it indents
  by the marker's width so nested lists work.
- Undo / redo cover formatting actions as well as typing.

### 3.4 Preview

- Three views per Markdown tab: **Edit** (text only), **Split** (text left, preview
  right) and **Preview** (formatted only). Split is the default for Markdown.
- Shows headings, paragraphs, bold/italic/strike, inline code, links (click opens in
  the web browser; hover shows the address), quotes with a coloured bar, bulleted /
  numbered / nested lists, **task lists with real checkboxes**, tables, dividers and
  code blocks coloured in their language.
- **Clicking a checkbox in the preview ticks it in the text** (`[ ]` ↔ `[x]`).
- Images show as a placeholder with their description for now **(decide)**.
- In Split view the preview follows the editor's scroll position roughly.
- Text width in the preview is capped (about 760 px) for comfortable reading.

### 3.5 Export

- **Export as HTML** writes a single, self-contained web page with simple styling.
- PDF export is not in the first version **(decide)**.

---

## 4. Reading code

- Opening any source file picks colours from its extension (Rust, Python, JavaScript,
  C/C++, C#, Go, Java, HTML, CSS, JSON, YAML, SQL, shell scripts and many more — around
  50 languages come bundled).
- If the guess is wrong, click the language in the status bar (or "Set Syntax…") to
  choose another.
- **Read-only mode** locks the file so it can be read, searched and copied without
  accidental edits. Example/sample code tabs open read-only.
- Line numbers, current-line highlight, minimap, find/replace and "go to line" all work
  the same as for Markdown.
- Word wrap is off by default for code (scroll sideways) and on for Markdown; either can
  be toggled.

---

## 5. Files and folders

| Action | Behaviour |
| --- | --- |
| New | Opens an empty "Untitled" Markdown tab. |
| Open… | Uses the system's own file picker. Several files can be chosen. |
| Open Folder… | Shows the folder as a tree in the side bar. Hidden folders and bulky ones (`node_modules`, `target`, `.git`) are skipped. Very large folders are capped so the app stays fast. |
| Drag and drop | Dropping files on the window opens them; dropping a folder opens it as the project folder. |
| Command line | `oxide-text notes.md` opens that file; `oxide-text some/folder` opens the folder; a file that doesn't exist yet opens as a new tab that will be saved there. |
| Save / Save As / Save All | Save As on an untitled tab asks where to save. After saving, the language is re-detected from the new extension. |
| Close tab | If unsaved: asks *Save / Don't save / Cancel*. |
| Quit / closing the window | If anything is unsaved, the same question, once for all files. |
| Encoding | Files are read and written as UTF-8. Line endings are kept as they were **(decide: show/convert?)**. |

---

## 6. Finding things

- **Find** (bottom bar): every match is highlighted in the editor; the bar shows
  "3 of 12". Next / previous wrap around the file. Options: match case, whole word.
- **Replace**: replace the current match and move on, or replace all at once (one undo
  step).
- **Go to File** (command list): fuzzy search across open tabs and the project folder —
  typing `rdme` finds `README.md`.
- **Go to Heading**: lists the headings of the current Markdown file.
- **Go to Line**: type a number, press Enter.
- **Command Palette**: every command by name, with its shortcut shown.

The fuzzy search favours letters that start words and letters next to each other, so
short abbreviations work well.

---

## 7. Look and settings

- **Two themes:** Dark (default; slate background with warm orange accents) and Light
  (warm off-white). Code colouring follows the theme.
- **Text size:** larger / smaller / reset (affects editor and preview together).
- **Toggles:** side bar, minimap, formatting bar, word wrap.
- Fonts: a built-in monospace font for the editor and a clean sans-serif for the
  preview, so the app looks the same on every system **(decide: allow custom fonts?)**.
- Remembering settings and open tabs between sessions **(decide)**.

---

## 8. First run

When opened with nothing to load, the app shows two tabs:

1. **Welcome.md** — in Split view, a short tour of the features and shortcuts, written
   in Markdown so it shows off the preview.
2. **example.rs** — a small read-only code sample to show code colouring.

**Help → Markdown Cheat Sheet** (F1) opens a reference tab with every Markdown feature
and what it looks like.

---

## 9. Edge cases the plan covers

- Very long files: colouring is cached and only redone when the text changes; the
  minimap and line numbers draw only what is visible.
- Non-English text (accents, CJK, emoji) — positions are counted in characters, not
  bytes, so cursor and formatting stay correct.
- Files that aren't valid UTF-8: open with a warning and read-only **(decide)**.
- A file changed by another program while open: not detected in the first version
  **(decide)**.

---

## 10. Testing that it works

The app gets a `--screenshot <file.png>` option: it opens normally, waits about 120
frames, saves a picture of its window and exits. This is used for automatic checks
after each build. The formatting actions, table alignment, document clean-up, list
continuation, outline and search are all plain-text functions and get small automatic
tests.
