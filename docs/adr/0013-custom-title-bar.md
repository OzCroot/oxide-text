---
status: accepted
date: 2026-11-10
deciders: [Oz]
---

# 0013 — Draw our own title bar

## Context

The app asked for a native title bar. On Linux, who draws it depends on the
compositor. The owner uses Hyprland, a tiling compositor that draws none, so
the window had no title bar at all. A native bar also looks different on
each system.

## Decision Drivers

- The same look and behaviour on Windows, macOS, and Linux
- The file name and the unsaved mark are always visible
- Little code, and no new dependency
- Dragging, double-click to maximise, and resizing at the edges must work

## Considered Options

- **Keep the native bar:** nothing to build, but it is missing on some Linux compositors.
- **Merge the tabs into the title bar:** saves a row, but it mixes two jobs and the tab strip is still growing (pins and groups come in M3).
- **A separate title bar in the app (`decorations: false`):** one slim row above the tabs.

## Decision

We will turn off native decorations and draw a **title bar in the app**
(`src/ui/components/TitleBar.tsx`). It shows the file name, a dot for unsaved
changes, and the minimise, maximise, and close buttons. The bar is a Tauri
drag area (`data-tauri-drag-region`), and a double click maximises the window.
The window title is still set, for the taskbar and the window manager.

On macOS the window keeps its own traffic-light buttons. The file
`tauri.macos.conf.json` sets `titleBarStyle: Overlay` and `hiddenTitle`, and
the bar leaves room for the buttons and draws none of its own.

## Consequences

- Tauri handles the drag and the edge resize for an undecorated window on Windows and Linux. We wrote no resize code.
- The webview needs these permissions: minimise, toggle maximise, close, is-maximised, and start-dragging (`capabilities/default.json`).
- The close button calls `close()`, so the "unsaved changes" question still runs.
- **Not tested:** Windows and macOS (the macOS file is only valid on macOS). Snap layouts on Windows 11 (hover on the maximise button) and the macOS full-screen mode are not handled.
- A tiling window manager ignores the maximise button and the drag. The buttons are harmless there.
- Merging the tabs into this bar stays possible later.
