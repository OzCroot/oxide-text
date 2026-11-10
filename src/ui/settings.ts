import type { Eol } from "@/lib/api";

export type ThemeSetting = "system" | "light" | "dark";

export type ViewMode = "source" | "preview" | "split";

export interface Settings {
  theme: ThemeSetting;
  editor: { fontSize: number; wordWrap: boolean };
  markdown: {
    defaultMode: ViewMode;
    /** The folder for pasted images, relative to the file. */
    imageDir: string;
    remoteImages: boolean;
    pasteHtmlAsMarkdown: boolean;
    formatTablesOnSave: boolean;
  };
  files: { defaultEol: Eol };
}

/** Used if the config cannot load. The same values are in src/tauri/default-settings.jsonc. */
export const fallbackSettings: Settings = {
  theme: "system",
  editor: { fontSize: 14, wordWrap: true },
  markdown: {
    defaultMode: "source",
    imageDir: "assets",
    remoteImages: false,
    pasteHtmlAsMarkdown: true,
    formatTablesOnSave: true,
  },
  files: { defaultEol: "lf" },
};

/** Check the settings from the config files. Bad values fall back to the defaults. */
export function sanitiseSettings(raw: unknown): Settings {
  const r = (raw ?? {}) as Partial<Settings>;
  const d = fallbackSettings;
  const theme = r.theme === "light" || r.theme === "dark" || r.theme === "system" ? r.theme : d.theme;
  const fontSize =
    typeof r.editor?.fontSize === "number" && r.editor.fontSize >= 6 && r.editor.fontSize <= 72
      ? r.editor.fontSize
      : d.editor.fontSize;
  const wordWrap = typeof r.editor?.wordWrap === "boolean" ? r.editor.wordWrap : d.editor.wordWrap;
  const m = r.markdown;
  const mode = m?.defaultMode;
  const defaultMode = mode === "source" || mode === "preview" || mode === "split" ? mode : d.markdown.defaultMode;
  // The image folder is a relative path inside the folder of the file. Refuse "..", and an absolute path.
  const dir = typeof m?.imageDir === "string" ? m.imageDir.trim() : "";
  const safeDir = dir !== "" && !/^([A-Za-z]:|[\\/])/.test(dir) && !dir.split(/[\\/]/).includes("..") ? dir : d.markdown.imageDir;
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  const markdown = {
    defaultMode,
    imageDir: safeDir,
    remoteImages: bool(m?.remoteImages, d.markdown.remoteImages),
    pasteHtmlAsMarkdown: bool(m?.pasteHtmlAsMarkdown, d.markdown.pasteHtmlAsMarkdown),
    formatTablesOnSave: bool(m?.formatTablesOnSave, d.markdown.formatTablesOnSave),
  };
  const eol = r.files?.defaultEol;
  const defaultEol = eol === "lf" || eol === "crlf" || eol === "cr" ? eol : d.files.defaultEol;
  return { theme, editor: { fontSize, wordWrap }, markdown, files: { defaultEol } };
}

export function resolveTheme(setting: ThemeSetting, systemDark: boolean): "light" | "dark" {
  return setting === "system" ? (systemDark ? "dark" : "light") : setting;
}
