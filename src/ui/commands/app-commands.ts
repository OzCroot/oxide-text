import type { Command } from "./registry";

export const appCommands: Command[] = [
  { id: "file.new", title: "New File", run: ({ app }) => app.newFile() },
  { id: "file.open", title: "Open File…", run: ({ app }) => app.openFiles() },
  { id: "file.save", title: "Save", run: ({ app }) => app.save() },
  { id: "file.saveAs", title: "Save As…", run: ({ app }) => app.saveAs() },
  { id: "tab.close", title: "Close Tab", run: ({ app }) => app.closeTab() },
  { id: "tab.next", title: "Next Tab", run: ({ app }) => app.nextTab() },
  { id: "tab.previous", title: "Previous Tab", run: ({ app }) => app.previousTab() },
  { id: "view.toggleTheme", title: "Toggle Light/Dark Theme", run: ({ app }) => app.toggleTheme() },
];
