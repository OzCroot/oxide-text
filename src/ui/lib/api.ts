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

/** For each path, whether it exists. */
export const checkPaths = (paths: string[]) => invoke<boolean[]>("check_paths", { paths });

/** Save pasted image data to `dir/<stem>-<n>.<ext>`. Returns the path of the new file. */
export const saveImage = (dir: string, stem: string, ext: string, bytes: ArrayBuffer) =>
  invoke<string>("save_image", bytes, {
    headers: { "x-dir": encodeURIComponent(dir), "x-stem": encodeURIComponent(stem), "x-ext": encodeURIComponent(ext) },
  });

export const loadConfig = () => invoke<Config>("load_config");
