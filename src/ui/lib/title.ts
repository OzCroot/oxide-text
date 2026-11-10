/** The text for the title bar and the window title: "notes.md — oxide-text". */
export function windowTitle(fileName: string | null): string {
  return fileName ? `${fileName} — oxide-text` : "oxide-text";
}

/** The window title for the window manager and the taskbar. A dot marks unsaved changes. */
export function taskbarTitle(fileName: string | null, dirty: boolean): string {
  return `${dirty && fileName ? "● " : ""}${windowTitle(fileName)}`;
}
