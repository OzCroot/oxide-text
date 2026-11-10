import { invoke } from "@tauri-apps/api/core";
import type { Binding } from "@/keymap/resolver";
import type { Settings } from "@/settings";

export type Eol = "lf" | "crlf" | "cr";

export interface OpenedFile {
  path: string;
  text: string;
  encoding: string;
  bom: boolean;
  eol: Eol;
  mixed_eol: boolean;
}

export interface Config {
  settings: Settings;
  keybindings: Binding[];
  errors: string[];
  configDir: string;
}

export const openFile = (path: string) => invoke<OpenedFile>("open_file", { path });

export const saveFile = (args: { path: string; text: string; encoding: string; bom: boolean; eol: Eol }) =>
  invoke<void>("save_file", args);

export const loadConfig = () => invoke<Config>("load_config");
