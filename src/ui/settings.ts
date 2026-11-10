import type { Eol } from "@/lib/api";

export type ThemeSetting = "system" | "light" | "dark";

export interface Settings {
  theme: ThemeSetting;
  editor: { fontSize: number; wordWrap: boolean };
  files: { defaultEol: Eol };
}

/** Used if the config cannot load. The same values are in src/tauri/default-settings.jsonc. */
export const fallbackSettings: Settings = {
  theme: "system",
  editor: { fontSize: 14, wordWrap: true },
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
  const eol = r.files?.defaultEol;
  const defaultEol = eol === "lf" || eol === "crlf" || eol === "cr" ? eol : d.files.defaultEol;
  return { theme, editor: { fontSize, wordWrap }, files: { defaultEol } };
}

export function resolveTheme(setting: ThemeSetting, systemDark: boolean): "light" | "dark" {
  return setting === "system" ? (systemDark ? "dark" : "light") : setting;
}
