import type { Command } from "./registry";

export const appCommands: Command[] = [
  { id: "file.new", title: "New File", run: ({ app }) => app.newFile() },
  { id: "file.open", title: "Open File…", run: ({ app }) => app.openFiles() },
  { id: "file.save", title: "Save", run: ({ app }) => app.save() },
  { id: "file.saveAs", title: "Save As…", run: ({ app }) => app.saveAs() },
  { id: "tab.close", title: "Close Tab", run: ({ app }) => app.closeTab() },
  { id: "tab.next", title: "Next Tab", run: ({ app }) => app.nextTab() },
  { id: "tab.previous", title: "Previous Tab", run: ({ app }) => app.previousTab() },
  { id: "view.source", title: "View: Source", run: ({ app }) => app.setViewMode("source") },
  { id: "view.preview", title: "View: Preview", run: ({ app }) => app.setViewMode("preview") },
  { id: "view.split", title: "View: Split", run: ({ app }) => app.setViewMode("split") },
  { id: "view.cycleMode", title: "View: Cycle Source, Split, Preview", run: ({ app }) => app.cycleViewMode() },
  { id: "view.toggleMenuBar", title: "View: Toggle Menu Bar", run: ({ app }) => app.toggleMenuBar() },
  { id: "view.toggleOutline", title: "View: Toggle Outline", run: ({ app }) => app.toggleOutline() },
  { id: "export.html", title: "Export as HTML…", run: ({ app }) => app.exportHtml() },
  { id: "export.pdf", title: "Export as PDF…", run: ({ app }) => app.exportPdf() },
  { id: "edit.copyAsRichText", title: "Copy as Rich Text", run: ({ app }) => app.copyAsRichText() },
  { id: "view.toggleTheme", title: "Toggle Light/Dark Theme", run: ({ app }) => app.toggleTheme() },
];
