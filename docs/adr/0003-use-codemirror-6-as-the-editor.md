---
status: proposed
date: 2026-11-10
deciders: [Oz]
---

# 0003 — Use CodeMirror 6 as the editor component

## Context

The editor must handle Markdown well, with a live mode that hides markup on
all lines except the cursor line. It must support multi-cursor editing,
folding, search, IME input, and accessibility. It must open files of 10 MB
or more.

## Decision Drivers

- Strong Markdown support, including GitHub Flavored Markdown
- A decoration API for the live mode
- Built-in commands for the VS Code and Sublime Text shortcuts
- Size, performance, and accessibility

## Considered Options

- **Monaco:** heavy, and weak for Markdown.
- **A custom editor:** too much work, and a high risk for IME and accessibility.
- **CodeMirror 6:** the Lezer Markdown parser, decorations and widgets, and many built-in commands.

## Decision

We will use **CodeMirror 6**, because it covers the Markdown, live mode, and
shortcut needs with the least code.

## Consequences

- Highlighting for code uses tree-sitter packs and CodeMirror decorations, not Lezer grammars. See [0004](./0004-language-packs-with-tree-sitter.md).
- Above a size threshold, files open in a read-only chunked viewer with no highlighting.
- The Live mode must never replace the text nodes on the cursor line. This protects IME and screen readers.
